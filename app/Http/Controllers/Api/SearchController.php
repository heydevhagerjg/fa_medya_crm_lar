<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\JobCrm;
use App\Models\Proposal;
use App\Models\ServiceTracking;
use App\Models\Payment;
use App\Models\Expense;
use App\Models\JobFile;

class SearchController extends \App\Http\Controllers\Controller
{
    public function search(Request $request)
    {
        try {
            $query = $request->query('q', '');
            
            if (!auth()->check()) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $tenantId = auth()->user()->tenant_id;

            if (strlen($query) < 2) {
                return response()->json([]);
            }

            $results = [];

            // Search Customers
            try {
                $customers = Customer::where('tenant_id', $tenantId)
                    ->where(function ($q) use ($query) {
                        $q->where('name', 'like', "%{$query}%")
                            ->orWhere('email', 'like', "%{$query}%")
                            ->orWhere('phone', 'like', "%{$query}%");
                    })
                    ->select('id', 'name', 'email', 'phone')
                    ->limit(5)
                    ->get()
                    ->map(function ($customer) {
                        return [
                            'type' => 'customer',
                            'id' => $customer->id,
                            'name' => $customer->name,
                            'description' => $customer->email ?: $customer->phone,
                        ];
                    });
                $results = array_merge($results, $customers->toArray());
            } catch (\Exception $e) {
                \Log::error('Customer search error: ' . $e->getMessage());
            }

            // Search Jobs
            try {
                $jobs = JobCrm::where('tenant_id', $tenantId)
                    ->where('title', 'like', "%{$query}%")
                    ->select('id', 'title', 'customer_id')
                    ->with('customer:id,name')
                    ->limit(5)
                    ->get()
                    ->map(function ($job) {
                        return [
                            'type' => 'job',
                            'id' => $job->id,
                            'name' => $job->title,
                            'description' => $job->customer ? $job->customer->name : null,
                        ];
                    });
                $results = array_merge($results, $jobs->toArray());
            } catch (\Exception $e) {
                \Log::error('Job search error: ' . $e->getMessage());
            }

            // Search Proposals
            try {
                $proposals = Proposal::where('tenant_id', $tenantId)
                    ->where('title', 'like', "%{$query}%")
                    ->select('id', 'title', 'customer_id')
                    ->with('customer:id,name')
                    ->limit(5)
                    ->get()
                    ->map(function ($proposal) {
                        $description = null;
                        if ($proposal->customer) {
                            $description = $proposal->customer->name;
                        }
                        return [
                            'type' => 'proposal',
                            'id' => $proposal->id,
                            'name' => $proposal->title,
                            'description' => $description,
                        ];
                    });
                $results = array_merge($results, $proposals->toArray());
            } catch (\Exception $e) {
                \Log::error('Proposal search error: ' . $e->getMessage());
            }

            // Search Service Tracking
            try {
                $serviceTrackings = ServiceTracking::where('tenant_id', $tenantId)
                    ->where('title', 'like', "%{$query}%")
                    ->select('id', 'title', 'customer_id')
                    ->with('customer:id,name')
                    ->limit(5)
                    ->get()
                    ->map(function ($st) {
                        $description = null;
                        if ($st->customer) {
                            $description = $st->customer->name;
                        }
                        return [
                            'type' => 'service_tracking',
                            'id' => $st->id,
                            'name' => $st->title,
                            'description' => $description,
                        ];
                    });
                $results = array_merge($results, $serviceTrackings->toArray());
            } catch (\Exception $e) {
                \Log::error('ServiceTracking search error: ' . $e->getMessage());
            }

            // Search Payments
            try {
                $payments = Payment::where('tenant_id', $tenantId)
                    ->where(function ($q) use ($query) {
                        $q->where('description', 'like', "%{$query}%")
                            ->orWhereHas('job', function ($job) use ($query) {
                                $job->where('title', 'like', "%{$query}%");
                            });
                    })
                    ->select('id', 'description', 'job_id')
                    ->with('job.customer:id,name')
                    ->limit(5)
                    ->get()
                    ->map(function ($payment) {
                        $description = null;
                        if ($payment->job && $payment->job->customer) {
                            $description = $payment->job->customer->name;
                        }
                        return [
                            'type' => 'payment',
                            'id' => $payment->id,
                            'name' => $payment->description ?: 'Tahsilat',
                            'description' => $description,
                        ];
                    });
                $results = array_merge($results, $payments->toArray());
            } catch (\Exception $e) {
                \Log::error('Payment search error: ' . $e->getMessage());
            }

            // Search Expenses
            try {
                $expenses = Expense::where('tenant_id', $tenantId)
                    ->where('title', 'like', "%{$query}%")
                    ->select('id', 'title', 'job_id')
                    ->with('job.customer:id,name')
                    ->limit(5)
                    ->get()
                    ->map(function ($expense) {
                        $description = null;
                        if ($expense->job && $expense->job->customer) {
                            $description = $expense->job->customer->name;
                        }
                        return [
                            'type' => 'expense',
                            'id' => $expense->id,
                            'name' => $expense->title,
                            'description' => $description,
                        ];
                    });
                $results = array_merge($results, $expenses->toArray());
            } catch (\Exception $e) {
                \Log::error('Expense search error: ' . $e->getMessage());
            }

            // Search Files
            try {
                $files = JobFile::whereHas('job', function($query) use ($tenantId) {
                    $query->where('tenant_id', $tenantId);
                })
                    ->where('file_name', 'like', "%{$query}%")
                    ->select('id', 'file_name', 'job_id')
                    ->with('job.customer:id,name')
                    ->limit(5)
                    ->get()
                    ->map(function ($file) {
                        $description = null;
                        if ($file->job && $file->job->customer) {
                            $description = $file->job->customer->name;
                        }
                        return [
                            'type' => 'file',
                            'id' => $file->id,
                            'name' => $file->file_name,
                            'description' => $description,
                        ];
                    });
                $results = array_merge($results, $files->toArray());
            } catch (\Exception $e) {
                \Log::error('File search error: ' . $e->getMessage());
            }

            // Limit total results to 20
            $results = array_slice($results, 0, 20);

            return response()->json($results);
        } catch (\Exception $e) {
            \Log::error('Search error: ' . $e->getMessage() . ' ' . $e->getFile() . ':' . $e->getLine());
            return response()->json(['error' => 'Search failed'], 500);
        }
    }
}
