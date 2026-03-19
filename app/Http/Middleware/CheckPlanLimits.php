<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class CheckPlanLimits
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $feature = null): Response
    {
        $user = $request->user();
        if (!$user || !$user->tenant) {
            return $next($request);
        }

        $tenant = $user->tenant;

        // Check subscription/trial status
        if (!$tenant->onTrial() && !$tenant->subscribed()) {
            // Allow access to billing routes even if not subscribed
            if (!$request->is('api/billing/*') && !$request->is('api/auth/me')) {
                return response()->json([
                    'message' => 'Deneme süreniz sona ermiştir. Lütfen devam etmek için abone olunuz.',
                    'subscription_required' => true
                ], 402);
            }
        }

        // If a specific feature is passed to the middleware, check if it's enabled
        if ($feature) {
            $label = $tenant->getFeatureLabel($feature);

            if (!$tenant->hasFeature($feature)) {
                return response()->json([
                    'message' => "{$label} özelliği paketinizde bulunmamaktadır. Lütfen paketinizi yükseltiniz."
                ], 403);
            }

            // If it's a store/create request, check the limit
            if ($request->isMethod('POST')) {
                if ($tenant->reachedLimit($feature)) {
                    $limit = $tenant->getLimitValue($feature);
                    return response()->json([
                        'message' => "Maksimum {$limit} adet {$label} ekleme limitine ulaştınız. Daha fazla eklemek için lütfen paketinizi yükseltiniz."
                    ], 403);
                }
            }
        }

        return $next($request);
    }
}
