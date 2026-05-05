<?php

namespace App\Services;

use Illuminate\Support\Collection;

class StaleCompanyFilter
{
    /**
     * Return companies not updated within $staleDays that have more than
     * $minEmployeeCount employees.
     *
     * Expects $companies to have employees_count loaded (via withCount).
     */
    public function filter(
        Collection $companies,
        int $staleDays = 30,
        int $minEmployeeCount = 10
    ): Collection {
        $threshold = now()->subDays($staleDays);

        return $companies
            ->filter(fn ($company) =>
                $company->updated_at->lt($threshold) &&
                $company->employees_count > $minEmployeeCount
            )
            ->values();
    }
}
