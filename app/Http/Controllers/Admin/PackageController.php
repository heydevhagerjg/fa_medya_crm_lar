<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Package;
use Illuminate\Http\Request;

class PackageController extends Controller
{
    public function index()
    {
        return response()->json(Package::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'trial_days' => 'required|integer|min:0',
            'paddle_product_id' => 'nullable|string|max:255',
            'paddle_price_id' => 'nullable|string|max:255',
            'personnel_limit' => 'required|integer|min:0',
            'customer_limit' => 'required|integer|min:0',
            'job_limit' => 'required|integer|min:0',
            'appointment_feature' => 'required|boolean',
            'appointment_limit' => 'required|integer|min:0',
            'service_tracking_feature' => 'required|boolean',
            'service_tracking_limit' => 'required|integer|min:0',
            'service_tracking_category_feature' => 'required|boolean',
            'service_tracking_category_limit' => 'required|integer|min:0',
            'proposal_feature' => 'required|boolean',
            'proposal_limit' => 'required|integer|min:0',
            'backup_feature' => 'required|boolean',
            'backup_limit' => 'required|integer|min:0',
            'services_section_feature' => 'required|boolean',
            'service_limit' => 'required|integer|min:0',
            'step_templates_feature' => 'required|boolean',
            'step_template_limit' => 'required|integer|min:0',
            'cash_register_limit' => 'required|integer|min:0',
            'api_key_feature' => 'required|boolean',
            'disk_usage_limit' => 'required|integer|min:0',
            'is_active' => 'required|boolean',
        ]);

        $package = Package::create($validated);
        return response()->json($package, 201);
    }

    public function show($id)
    {
        $package = Package::findOrFail($id);
        return response()->json($package);
    }

    public function update(Request $request, $id)
    {
        $package = Package::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'trial_days' => 'required|integer|min:0',
            'paddle_product_id' => 'nullable|string|max:255',
            'paddle_price_id' => 'nullable|string|max:255',
            'personnel_limit' => 'required|integer|min:0',
            'customer_limit' => 'required|integer|min:0',
            'job_limit' => 'required|integer|min:0',
            'appointment_feature' => 'required|boolean',
            'appointment_limit' => 'required|integer|min:0',
            'service_tracking_feature' => 'required|boolean',
            'service_tracking_limit' => 'required|integer|min:0',
            'service_tracking_category_feature' => 'required|boolean',
            'service_tracking_category_limit' => 'required|integer|min:0',
            'proposal_feature' => 'required|boolean',
            'proposal_limit' => 'required|integer|min:0',
            'backup_feature' => 'required|boolean',
            'backup_limit' => 'required|integer|min:0',
            'services_section_feature' => 'required|boolean',
            'service_limit' => 'required|integer|min:0',
            'step_templates_feature' => 'required|boolean',
            'step_template_limit' => 'required|integer|min:0',
            'cash_register_limit' => 'required|integer|min:0',
            'api_key_feature' => 'required|boolean',
            'disk_usage_limit' => 'required|integer|min:0',
            'is_active' => 'required|boolean',
        ]);

        $package->update($validated);
        return response()->json($package);
    }

    public function syncTenants($id)
    {
        $package = Package::findOrFail($id);
        $tenants = $package->tenants;

        foreach ($tenants as $tenant) {
            $tenant->applyPackage($package);
        }

        return response()->json([
            'message' => count($tenants) . ' firmanın limitleri güncellendi.',
            'count' => count($tenants)
        ]);
    }

    public function destroy($id)
    {
        $package = Package::findOrFail($id);
        $package->delete();
        return response()->json(['message' => 'Paket başarıyla silindi.']);
    }
}
