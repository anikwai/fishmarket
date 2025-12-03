{{-- Notes Section for PDF Documents --}}
{{-- Required: $notes (string, can be null/empty) --}}
@if(!empty($notes))
    <div class="notes-section">
        <div class="notes-title">Additional Notes</div>
        <div class="notes-content">{{ $notes }}</div>
    </div>
@endif
