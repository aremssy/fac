<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GigWorkforceAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'gig_user_id',
        'company_id',
        'assigned_by',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'gig_user_id');
    }

    public function company()
    {
        return $this->belongsTo(User::class, 'company_id');
    }

    public function assigner()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
