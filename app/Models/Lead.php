<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'contact_name',
        'contact_email',
        'phone',
        'company_name',
        'source',
        'status',
        'assigned_to',
        'created_by',
        'converted_company_user_id',
    ];

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function convertedCompanyUser()
    {
        return $this->belongsTo(User::class, 'converted_company_user_id');
    }

    public function commissions()
    {
        return $this->hasMany(Commission::class);
    }
}
