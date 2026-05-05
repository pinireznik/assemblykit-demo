@extends('layouts.app')

@section('title', 'Companies')

@section('content')
<h1>Companies</h1>

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Employees</th>
            <th>Last Updated</th>
        </tr>
    </thead>
    <tbody>
        @foreach($companies as $company)
        <tr>
            <td><a href="{{ route('companies.show', $company) }}" class="row-link">{{ $company->name }}</a></td>
            <td><span class="badge">{{ $company->employees_count }}</span></td>
            <td>{{ $company->updated_at->diffForHumans() }}</td>
        </tr>
        @endforeach
    </tbody>
</table>
@endsection
