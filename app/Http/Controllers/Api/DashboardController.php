<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\JobCrm;
use App\Models\Payment;
use App\Models\Expense;
use App\Models\CashRegister;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $totalCustomers = Customer::where('tenant_id', $tenantId)->count();

        $activeJobs = JobCrm::where('tenant_id', $tenantId)
            ->whereIn('status', ['PENDING', 'IN_PROGRESS'])
            ->count();

        $totalRevenue = JobCrm::where('tenant_id', $tenantId)
            ->sum('total_price');

        $totalPayments = Payment::where('tenant_id', $tenantId)->sum('amount');

        $totalExpenses = Expense::where('tenant_id', $tenantId)->sum('amount');

        $recentJobs = JobCrm::where('tenant_id', $tenantId)
            ->with(['customer', 'jobStatus'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn($j) => [
                'id'        => $j->id,
                'title'     => $j->title,
                'status'    => $j->status,
                'customer'  => ['name' => $j->customer?->name],
                'jobStatus' => $j->jobStatus,
                'createdAt' => $j->created_at,
            ]);

        $recentPayments = Payment::where('tenant_id', $tenantId)
            ->with(['job'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn($p) => [
                'id'          => $p->id,
                'amount'      => $p->amount,
                'paymentDate' => $p->payment_date,
                'paymentType' => $p->payment_type,
                'job'         => ['title' => $p->job?->title],
            ]);

        $completedJobs = JobCrm::where('tenant_id', $tenantId)->where('status', 'COMPLETED')->count();

        $jobsByStatus = JobCrm::where('tenant_id', $tenantId)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');

        $cashRegisters = CashRegister::where('tenant_id', $tenantId)->get()->map(function ($cr) use ($tenantId) {
            $payments = Payment::where('tenant_id', $tenantId)->where('cash_register_id', $cr->id)->sum('amount');
            $expenses = Expense::where('tenant_id', $tenantId)->where('cash_register_id', $cr->id)->sum('amount');
            return [
                'id'        => $cr->id,
                'name'      => $cr->name,
                'balance'   => $payments - $expenses,
                'isDefault' => $cr->is_default,
            ];
        });

        return response()->json([
            'totalCustomers' => $totalCustomers,
            'activeJobs'     => $activeJobs,
            'completedJobs'  => $completedJobs,
            'totalRevenue'   => $totalRevenue,
            'totalPayments'  => $totalPayments,
            'totalExpenses'  => $totalExpenses,
            'netProfit'      => $totalPayments - $totalExpenses,
            'recentJobs'     => $recentJobs,
            'recentPayments' => $recentPayments,
            'jobsByStatus'   => $jobsByStatus,
            'cashRegisters'  => $cashRegisters,
        ]);
    }
}
