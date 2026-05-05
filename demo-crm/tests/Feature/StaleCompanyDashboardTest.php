<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Services\StaleCompanyFilter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class StaleCompanyDashboardTest extends TestCase
{
    use RefreshDatabase;

    private function makeCompany(string $name, int $daysAgo, int $employeeCount): Company
    {
        $company = Company::create(['name' => $name]);

        // Use DB directly so updated_at isn't overwritten by Eloquent's timestamp logic.
        DB::table('companies')
            ->where('id', $company->id)
            ->update(['updated_at' => now()->subDays($daysAgo)]);

        $company->refresh();

        for ($i = 1; $i <= $employeeCount; $i++) {
            Employee::create(['company_id' => $company->id, 'name' => "Person {$i}"]);
        }

        return $company;
    }

    // ── StaleCompanyFilter unit-level tests ───────────────────────────────────

    public function test_stale_company_with_many_employees_is_shown(): void
    {
        // Mirrors Acme Corp: 45 days stale, 12 employees — should appear.
        $this->makeCompany('Old Big Corp', 45, 12);

        $result = (new StaleCompanyFilter)->filter(
            Company::withCount('employees')->get()
        );

        $this->assertCount(1, $result);
        $this->assertEquals('Old Big Corp', $result->first()->name);
    }

    public function test_recent_company_with_many_employees_is_not_shown(): void
    {
        // Mirrors Bright Labs: 5 days stale, 15 employees — too recent.
        $this->makeCompany('New Big Corp', 5, 15);

        $result = (new StaleCompanyFilter)->filter(
            Company::withCount('employees')->get()
        );

        $this->assertCount(0, $result);
    }

    public function test_stale_company_with_few_employees_is_not_shown(): void
    {
        // Mirrors Cedar Systems: 60 days stale, 4 employees — too small.
        $this->makeCompany('Old Small Corp', 60, 4);

        $result = (new StaleCompanyFilter)->filter(
            Company::withCount('employees')->get()
        );

        $this->assertCount(0, $result);
    }

    // ── Dashboard HTTP tests ──────────────────────────────────────────────────

    public function test_dashboard_shows_needing_attention_section(): void
    {
        $this->makeCompany('Flagged Corp', 45, 12);

        $this->get('/dashboard')
            ->assertStatus(200)
            ->assertSee('Companies needing attention')
            ->assertSee('Flagged Corp');
    }

    public function test_dashboard_excludes_recent_companies_from_attention_section(): void
    {
        // Only a recent company exists — the section should not render at all.
        $this->makeCompany('Fresh Corp', 5, 15);

        $this->get('/dashboard')
            ->assertStatus(200)
            ->assertDontSee('Companies needing attention');
    }
}
