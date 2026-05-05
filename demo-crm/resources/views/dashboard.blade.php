@extends('layouts.app')

@section('title', 'Dashboard')

@section('content')
<h1>Dashboard</h1>

<div class="cards-grid">
    <x-dashboard-card label="Total Companies" :value="$totalCompanies" sub="All time" />
    <x-dashboard-card label="Total Employees" :value="$totalEmployees" sub="Across all companies" />
    <x-dashboard-card
        label="Needing Attention"
        :value="$needsAttention->count()"
        sub="30+ days stale · 10+ employees"
    />
</div>

@if($needsAttention->isNotEmpty())
<h2 style="margin-top:2rem;">Companies needing attention</h2>
<p style="font-size:0.85rem;color:#718096;margin-bottom:1rem;">
    Not updated in 30+ days and more than 10 employees.
</p>
<table>
    <thead>
        <tr>
            <th>Company</th>
            <th>Employees</th>
            <th>Last Updated</th>
            <th>Days stale</th>
        </tr>
    </thead>
    <tbody>
        @foreach($needsAttention as $company)
        <tr>
            <td><a href="{{ route('companies.show', $company) }}" class="row-link">{{ $company->name }}</a></td>
            <td><span class="badge">{{ $company->employees_count }}</span></td>
            <td>{{ $company->updated_at->format('M j, Y') }}</td>
            <td><span class="badge" style="background:#fef3c7;color:#b45309;">{{ abs((int) now()->diffInDays($company->updated_at)) }}d</span></td>
        </tr>
        @endforeach
    </tbody>
</table>
@endif

<h2 style="margin-top:2rem;">Recently Updated Companies</h2>
<table>
    <thead>
        <tr>
            <th>Company</th>
            <th>Employees</th>
            <th>Last Updated</th>
        </tr>
    </thead>
    <tbody>
        @foreach($recentCompanies as $company)
        <tr>
            <td><a href="{{ route('companies.show', $company) }}" class="row-link">{{ $company->name }}</a></td>
            <td><span class="badge">{{ $company->employees_count }}</span></td>
            <td>{{ $company->updated_at->diffForHumans() }}</td>
        </tr>
        @endforeach
    </tbody>
</table>
@endsection
