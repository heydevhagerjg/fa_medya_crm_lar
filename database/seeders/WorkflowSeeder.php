<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Workflow;
use App\Models\Proposal;

class WorkflowSeeder extends Seeder
{
    public function run()
    {
        // Örnek: Teklif Kabul Edilince Mail Gönder
        $workflow = Workflow::create([
            'tenant_id'     => \App\Models\Tenant::first()?->id ?? 'demo', 
            'name'          => 'Teklif Kabul Bildirimi',
            'trigger_model' => Proposal::class,
            'trigger_event' => 'updated',
            'is_active'     => true,
        ]);

        $workflow->conditions()->create([
            'field'    => 'status',
            'operator' => '=',
            'value'    => 'ACCEPTED',
        ]);

        $workflow->actions()->create([
            'type'       => 'send_email',
            'parameters' => [
                'to'      => 'info@example.com',
                'subject' => 'Yeni Kabul Edilen Teklif: {title}',
                'body'    => "Merhaba,\n\n{title} başlıklı teklif kabul edilmiştir.\nToplam Tutar: {total_price} {currency}\n\nİyi çalışmalar.",
            ],
        ]);
    }
}
