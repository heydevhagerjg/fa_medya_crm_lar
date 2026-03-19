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
        $user = $request->user();
        $tenantId = $user->tenant_id;
        $isUser = $user->role !== 'ADMIN' && !$user->can('jobs.view_all');

        $totalCustomers = Customer::where('tenant_id', $tenantId)->count();

        $activeJobsQuery = JobCrm::where('tenant_id', $tenantId);
        if ($isUser) $activeJobsQuery->where('user_id', $user->id);
        $activeJobs = $activeJobsQuery->whereHas('jobStatus', function($q) {
                $q->where('name', 'NOT LIKE', '%Tamamlandı%')
                  ->where('name', 'NOT LIKE', '%İptal%')
                  ->where('name', 'NOT LIKE', '%Bitti%');
            })
            ->count();
        
        $totalJobsQuery = JobCrm::where('tenant_id', $tenantId);
        if ($isUser) $totalJobsQuery->where('user_id', $user->id);
        $totalJobs = $totalJobsQuery->count();

        $totalRevenueQuery = JobCrm::where('tenant_id', $tenantId);
        if ($isUser) $totalRevenueQuery->where('user_id', $user->id);
        $totalRevenue = $totalRevenueQuery->sum('total_price');

        $totalPaymentsQuery = Payment::where('tenant_id', $tenantId);
        if ($isUser) $totalPaymentsQuery->whereHas('job', fn($q) => $q->where('user_id', $user->id));
        $totalPayments = $totalPaymentsQuery->sum('amount');

        $totalExpensesQuery = Expense::where('tenant_id', $tenantId);
        if ($isUser) $totalExpensesQuery->whereHas('job', fn($q) => $q->where('user_id', $user->id));
        $totalExpenses = $totalExpensesQuery->sum('amount');

        $recentJobsQuery = JobCrm::where('tenant_id', $tenantId);
        if ($isUser) $recentJobsQuery->where('user_id', $user->id);
        $recentJobs = $recentJobsQuery->with(['customer', 'jobStatus'])
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

        $recentPaymentsQuery = Payment::where('tenant_id', $tenantId);
        if ($isUser) $recentPaymentsQuery->whereHas('job', fn($q) => $q->where('user_id', $user->id));
        $recentPayments = $recentPaymentsQuery->with(['job'])
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

        $completedJobsQuery = JobCrm::where('tenant_id', $tenantId);
        if ($isUser) $completedJobsQuery->where('user_id', $user->id);
        $completedJobs = $completedJobsQuery->whereHas('jobStatus', function($q) {
                $q->where('name', 'LIKE', '%Tamamlandı%')
                  ->orWhere('name', 'LIKE', '%Bitti%');
            })
            ->count();

        $jobsByStatusQuery = JobCrm::where('tenant_id', $tenantId);
        if ($isUser) $jobsByStatusQuery->where('user_id', $user->id);
        $jobsByStatus = $jobsByStatusQuery->with('jobStatus')
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
            ->where('status', 'PENDING')
            ->where('start_time', '>=', now()->subHours(3))
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

        $upcomingServiceTrackings = \App\Models\ServiceTracking::where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->whereBetween('next_date', [now()->subDays(7)->toDateString(), now()->addDays(7)->toDateString()])
            ->with(['customer', 'category', 'job.customer'])
            ->orderBy('next_date')
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'title' => $t->title,
                'next_date' => $t->next_date,
                'customer' => ['name' => $t->customer?->name],
                'category' => ['name' => $t->category?->name],
                'missed_count' => count($t->getMissedDates()),
            ]);

        $paymentsForVatQuery = Payment::where('tenant_id', $tenantId)
            ->whereHas('job', function($q) use ($isUser, $user) {
                $q->where('is_vat_included', true);
                if ($isUser) $q->where('user_id', $user->id);
            })
            ->with('job');
            
        $totalVat = $paymentsForVatQuery->get()->sum(function($p) {
            $vatRate = $p->job->vat_rate ?? 20;
            if ($vatRate <= 0) return 0;
            return (float) $p->amount * ($vatRate / (100 + $vatRate));
        });

        return response()->json([
            'totalCustomers'       => $totalCustomers,
            'totalJobs'            => $totalJobs,
            'activeJobs'           => $activeJobs,
            'completedJobs'        => $completedJobs,
            'totalRevenue'         => $totalRevenue,
            'totalPayments'        => $totalPayments,
            'totalExpenses'        => $totalExpenses,
            'totalVat'             => $totalVat,
            'netProfit'            => $totalPayments - $totalExpenses,
            'recentJobs'           => $recentJobs,
            'recentPayments'       => $recentPayments,
            'jobsByStatus'         => $jobsByStatus,
            'cashRegisters'        => $cashRegisters,
            'upcomingAppointments' => $upcomingAppointments,
            'upcomingServiceTrackings' => $upcomingServiceTrackings,
        ]);
    }
}
