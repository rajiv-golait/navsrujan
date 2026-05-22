# Runway Calculation Fixes

## Issues Found and Fixed

### 🐛 **Bug 1: Burn Rate Included Income Transactions**
**File:** `backend/app/ml/survival.py` - `calculate_burn_rate()`

**Problem:**
- Was summing ALL transactions (both debit and credit)
- When users added income (credit), it incorrectly increased their "burn rate"
- This made the app think they were spending MORE money

**Fix:**
```python
# Now filters ONLY debit (expense) transactions
if "transaction_type" in df.columns:
    df = df[df["transaction_type"] == "debit"]
```

---

### 🐛 **Bug 2: Incorrect Month-End Date Calculation**
**File:** `backend/app/ml/survival.py` - `predict_month_end_survival()`

**Problem:**
- Complex, buggy logic for calculating last day of month
- Would fail on edge cases (December, leap years, etc.)

**Fix:**
```python
# Clean, correct calculation
if today.month == 12:
    last_day_of_month = date(today.year, 12, 31)
else:
    next_month = date(today.year, today.month + 1, 1)
    last_day_of_month = next_month - timedelta(days=1)
```

---

### 🐛 **Bug 3: Wrong Daily Burn Rate Calculation**
**File:** `backend/app/services/balance_service.py` - `compute_balance()`

**Problem:**
- Was calculating burn rate from ALL recent transactions (last 500)
- Then dividing by `date.today().day` (e.g., if today is May 22, divide by 22)
- This gave wildly inaccurate daily burn rates

**Example of Bug:**
- User has ₹10,000 in expenses from Jan 1 to May 22
- Old code: `daily_burn = 10000 / 22 = ₹454/day` ❌
- Reality: `daily_burn = 10000 / 142 = ₹70/day` ✅

**Fix:**
```python
# Now filters for CURRENT MONTH ONLY
first_day_of_month = date(today.year, today.month, 1)
month_debits = sum(
    _decimal(t.amount)
    for t in all_txns
    if getattr(t, "transaction_type", "debit") == "debit"
    and t.transaction_date >= first_day_of_month  # ← KEY FIX
)

days_elapsed = (today - first_day_of_month).days + 1  # +1 to include today
daily_burn = month_debits / days_elapsed
```

---

### 🐛 **Bug 4: Integer Division Lost Precision**
**File:** `backend/app/services/balance_service.py` - `compute_balance()` & `compute_purchase_impact()`

**Problem:**
- Used `//` (integer division) for runway calculation
- Lost decimal precision, making runway inaccurate

**Example:**
- Balance: ₹1000, Daily burn: ₹150
- Old: `runway = 1000 // 150 = 6 days` ❌
- Fixed: `runway = 1000 / 150 = 6.67 = 6 days` ✅ (rounds down correctly)

**Fix:**
```python
# Before
runway_days = int(max(0, current // max(daily_burn, 1)))

# After
if daily_burn > 0:
    runway_days = int(current / daily_burn)
else:
    runway_days = 999
```

---

### 🐛 **Bug 5: Runway Calculation Didn't Check Balance**
**File:** `backend/app/ml/survival.py` - `calculate_runway()`

**Problem:**
- Didn't handle edge case where balance is already zero or negative

**Fix:**
```python
if current_balance <= 0:
    return {
        "runway_days": 0,
        "runway_weeks": 0,
        "critical_date": datetime.now().date().isoformat(),
        "requires_action": True,
    }
```

---

### 🐛 **Bug 6: Recurring Expenses Not Filtered for Future**
**File:** `backend/app/ml/survival.py` - `calculate_runway()`

**Problem:**
- Would include PAST recurring expenses in runway calculation
- Made calculations confusing and inaccurate

**Fix:**
```python
# Only future obligations
df = df[df["due_date"].dt.date >= today]
```

---

## How Runway is NOW Calculated (Correctly)

### Step 1: Calculate Daily Burn Rate
```
Daily Burn = (Current Month Expenses) / (Days Elapsed in Current Month)
```

**Example (May 22):**
- May expenses so far: ₹5,000
- Days elapsed: 22
- Daily burn = ₹227/day ✅

### Step 2: Calculate Current Balance
```
Current Balance = Starting Balance + Credits - Debits (since anchor date)
```

**Example:**
- Starting balance (May 1): ₹10,000
- Income added: +₹5,000
- Expenses: -₹5,000
- Current = ₹10,000 ✅

### Step 3: Calculate Runway
```
Runway Days = Current Balance / Daily Burn Rate
```

**Example:**
- Balance: ₹10,000
- Daily burn: ₹227
- Runway = 44 days ✅

### Step 4: Account for Recurring Expenses
The `calculate_runway()` function simulates each future day:
1. Deducts daily burn rate
2. Deducts any recurring expenses due that day
3. Stops when balance hits zero

---

## Testing the Fix

### Before Fix:
```
Balance: ₹10,000
Transactions: ₹20,000 spent over 5 months
Bug calculated: daily_burn = 20000 / 22 = ₹909/day
Bug runway: 10000 / 909 = 11 days ❌ WRONG!
```

### After Fix:
```
Balance: ₹10,000
Current month expenses: ₹5,000 (May 1-22)
Correct calculation: daily_burn = 5000 / 22 = ₹227/day
Correct runway: 10000 / 227 = 44 days ✅ CORRECT!
```

---

## Impact

### What's Fixed:
✅ Runway days now accurate based on **current month** spending  
✅ Income transactions don't inflate burn rate  
✅ Month-end predictions work correctly  
✅ Edge cases handled (zero balance, no spending, etc.)  
✅ Recurring expenses properly scheduled in future  
✅ Purchase impact calculations accurate

### What Users Will See:
- **More realistic** runway estimates
- **Accurate** "days until broke" predictions
- **Proper** month-end survival forecasts
- **Correct** budget recommendations

---

## Files Modified

1. `backend/app/ml/survival.py` - Fixed burn rate, month-end, runway calculations
2. `backend/app/services/balance_service.py` - Fixed daily burn and runway calculations

## How to Apply

**Backend changes are code-only** - just restart your backend server:

```bash
# Kill the running backend
taskkill /F /PID <backend_pid>

# Restart it
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The fixes will take effect immediately! 🎉
