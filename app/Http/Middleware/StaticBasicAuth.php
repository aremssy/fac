<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class StaticBasicAuth
{
    public function handle(Request $request, Closure $next)
    {
        $authHeader = $request->header('Authorization');
        if (!$authHeader || !str_starts_with($authHeader, 'Basic ')) {
            return Response::make('Unauthorized', 401, ['WWW-Authenticate' => 'Basic realm="API"']);
        }
        $decoded = base64_decode(substr($authHeader, 6)) ?: '';
        $parts = explode(':', $decoded, 2);
        $user = $parts[0] ?? '';
        $pass = $parts[1] ?? '';
        $expectedUser = getenv('AREMS_BASIC_USER') ?: '';
        $expectedPass = getenv('AREMS_BASIC_PASSWORD') ?: '';
        if ($user !== $expectedUser || $pass !== $expectedPass) {
            return Response::make('Unauthorized', 401, ['WWW-Authenticate' => 'Basic realm="API"']);
        }
        return $next($request);
    }
}
