<?php

namespace App\Models;

class Consultation extends BaseModel
{
    protected $fillable = [
        'full_name',
        'email',
        'phone',
        'company',
        'service_of_interest',
        'message',
        'created_by',
    ];
}
