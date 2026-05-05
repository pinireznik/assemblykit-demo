<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'AssemblyKit CRM') — Demo CRM</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f6fa; color: #1a1a2e; }

        nav {
            background: #1a1a2e;
            padding: 0 2rem;
            display: flex;
            align-items: center;
            gap: 2rem;
            height: 56px;
        }
        nav .brand { color: #fff; font-weight: 700; font-size: 1rem; letter-spacing: 0.04em; text-decoration: none; }
        nav a { color: #a0aec0; text-decoration: none; font-size: 0.875rem; padding: 0.25rem 0; }
        nav a:hover, nav a.active { color: #fff; }
        nav a.active { border-bottom: 2px solid #6366f1; }

        .container { max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem; }

        h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #1a1a2e; }
        h2 { font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; }

        .cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 2rem; }

        table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.07); }
        th { text-align: left; padding: 0.75rem 1rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #718096; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
        td { padding: 0.75rem 1rem; border-bottom: 1px solid #f0f4f8; font-size: 0.9rem; }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: #fafbff; }
        a.row-link { color: #6366f1; text-decoration: none; font-weight: 500; }
        a.row-link:hover { text-decoration: underline; }

        .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; background: #eef2ff; color: #4f46e5; }

        .back-link { display: inline-block; margin-bottom: 1.25rem; color: #6366f1; text-decoration: none; font-size: 0.875rem; }
        .back-link:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <nav>
        <a href="/dashboard" class="brand">Demo CRM</a>
        <a href="/dashboard" class="{{ request()->is('dashboard') ? 'active' : '' }}">Dashboard</a>
        <a href="/companies" class="{{ request()->is('companies*') ? 'active' : '' }}">Companies</a>
    </nav>
    <div class="container">
        @yield('content')
    </div>
</body>
</html>
