<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    // 1. Read All Employees
    public function index()
    {
        return response()->json(Employee::all());
    }

    // 2. Create New Employee Record
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:employees,email',
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:Admin,Cashier,Kitchen Staff',
            'status' => 'required|in:Active,Inactive,On Break',
            'pin' => 'nullable|string|size:4'
        ]);

        $employee = Employee::create($validated);

        return response()->json([
            'message' => 'New team member onboarded successfully!',
            'employee' => $employee
        ], 201);
    }

    // FIX: Explicitly declared the $id primitive constraint parameter type
    public function update(Request $request, string $id)
    {
        $employee = Employee::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:employees,email,' . $id,
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:Admin,Cashier,Kitchen Staff',
            'status' => 'required|in:Active,Inactive,On Break',
            'pin' => 'nullable|string|size:4'
        ]);

        $employee->update($validated);

        return response()->json([
            'message' => 'Employee records updated successfully.',
            'employee' => $employee
        ]);
    }

    // FIX: Explicitly declared the $id primitive constraint parameter type
    public function destroy(string $id)
    {
        $employee = Employee::findOrFail($id);
        $employee->delete();

        return response()->json([
            'message' => 'Employee removed from terminal registry.'
        ]);
    }
}
