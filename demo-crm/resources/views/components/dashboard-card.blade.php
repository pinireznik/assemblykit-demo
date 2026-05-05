<div style="background:#fff; border-radius:8px; padding:1.25rem 1.5rem; box-shadow:0 1px 3px rgba(0,0,0,.07);">
    <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.06em; color:#718096; margin-bottom:0.5rem;">
        {{ $label }}
    </div>
    <div style="font-size:2rem; font-weight:700; color:#1a1a2e; line-height:1.1;">
        {{ $value }}
    </div>
    @isset($sub)
    <div style="font-size:0.8rem; color:#a0aec0; margin-top:0.35rem;">{{ $sub }}</div>
    @endisset
</div>
