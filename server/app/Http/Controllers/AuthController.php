<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $employee = Employee::where('email', $request->email)->first();

        // If you don't see this exact line in your file, you are running the old code!
        if (!$employee || $employee->pin !== $request->password) {
            return response()->json(['message' => 'Invalid email or access PIN.'], 401);
        }

        if ($employee->status === 'Inactive') {
            return response()->json(['message' => 'This account has been deactivated.'], 403);
        }

        $token = $employee->createToken('pos-terminal-access')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'employee' => $employee
        ]);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request)
    {
        return response()->json($request->user());
    }
}
