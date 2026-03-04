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
            ->whereHas('jobStatus', function($q) {
                $q->where('name', 'NOT LIKE', '%Tamamlandı%')
                  ->where('name', 'NOT LIKE', '%İptal%')
                  ->where('name', 'NOT LIKE', '%Bitti%');
            })
            ->count();
        // If the above is too complex, we can just say total jobs or let user define.
        // But let's try a simple heuristic for now or just return total.
        $totalJobs = JobCrm::where('tenant_id', $tenantId)->count();

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
                'status'    => $j->job_status_id,
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

        $completedJobs = JobCrm::where('tenant_id', $tenantId)
            ->whereHas('jobStatus', function($q) {
                $q->where('name', 'LIKE', '%Tamamlandı%')
                  ->orWhere('name', 'LIKE', '%Bitti%');
            })
            ->count();

        $jobsByStatus = JobCrm::where('tenant_id', $tenantId)
            ->with('jobStatus')
            ->selectRaw('job_status_id, COUNT(*) as count')
            ->groupBy('job_status_id')
            ->get()
            ->map(fn($item) => [
                'name' => $item->jobStatus->name ?? 'Belirtilmemiş',
                'color' => $item->jobStatus->color ?? '#94a3b8',
                'count' => $item->count
            ]);

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

        $upcomingAppointments = \App\Models\Appointment::where('tenant_id', $tenantId)
            ->where('start_time', '>=', now()->startOfDay())
            ->where('start_time', '<=', now()->addDays(3)->endOfDay())
            ->with('customer')
            ->orderBy('start_time')
            ->get()
            ->map(fn($a) => [
                'id'         => $a->id,
                'title'      => $a->title,
                'startTime'  => $a->start_time,
                'customer'   => ['name' => $a->customer?->name],
                'status'     => $a->status,
            ]);

        return response()->json([
            'totalCustomers'       => $totalCustomers,
            'totalJobs'            => $totalJobs,
            'activeJobs'           => $activeJobs,
            'completedJobs'        => $completedJobs,
            'totalRevenue'         => $totalRevenue,
            'totalPayments'        => $totalPayments,
            'totalExpenses'        => $totalExpenses,
            'netProfit'            => $totalPayments - $totalExpenses,
            'recentJobs'           => $recentJobs,
            'recentPayments'       => $recentPayments,
            'jobsByStatus'         => $jobsByStatus,
            'cashRegisters'        => $cashRegisters,
            'upcomingAppointments' => $upcomingAppointments,
        ]);
    }
}
