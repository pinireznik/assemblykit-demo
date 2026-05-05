@extends('layouts.app')

@section('title', $company->name)

@section('content')
<a href="{{ route('companies.index') }}" class="back-link">← Back to Companies</a>

<h1>{{ $company->name }}</h1>

<div class="cards-grid" style="margin-bottom:2rem;">
    <x-dashboard-card label="Employees" :value="$company->employees->count()" />
    <x-dashboard-card label="Last Updated" :value="$company->updated_at->format('M j, Y')" :sub="$company->updated_at->diffForHumans()" />
</div>

<h2>Employees</h2>

@if($company->employees->isEmpty())
    <p style="color:#718096; font-size:0.9rem;">No employees yet.</p>
@else
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Joined</th>
            </tr>
        </thead>
        <tbody>
            @foreach($company->employees as $employee)
            <tr>
                <td>{{ $employee->name }}</td>
                <td>{{ $employee->created_at->format('M j, Y') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
@endif
@endsection
