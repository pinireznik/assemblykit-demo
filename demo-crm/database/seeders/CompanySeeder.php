<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Company;
use App\Models\Employee;
use Illuminate\Support\Carbon;

class CompanySeeder extends Seeder
{
    public function run(): void
    {
        $companies = [
            ['name' => 'Acme Corp',      'days_ago' => 45, 'employees' => 12],
            ['name' => 'Bright Labs',    'days_ago' => 5,  'employees' => 15],
            ['name' => 'Cedar Systems', 'days_ago' => 60, 'employees' => 4],
            ['name' => 'Delta Works',   'days_ago' => 40, 'employees' => 20],
            ['name' => 'Echo Studio',   'days_ago' => 1,  'employees' => 2],
        ];

        foreach ($companies as $data) {
            $updatedAt = Carbon::now()->subDays($data['days_ago']);

            $company = Company::create(['name' => $data['name']]);
            $company->updated_at = $updatedAt;
            $company->save();

            $firstNames = ['Alice','Bob','Carol','Dan','Eva','Frank','Grace','Hank','Iris','Jack',
                           'Karen','Leo','Mia','Noah','Olivia','Pete','Quinn','Rosa','Sam','Tara'];

            for ($i = 0; $i < $data['employees']; $i++) {
                Employee::create([
                    'company_id' => $company->id,
                    'name'       => $firstNames[$i % count($firstNames)] . ' ' . chr(65 + $i) . '.',
                ]);
            }
        }
    }
}
