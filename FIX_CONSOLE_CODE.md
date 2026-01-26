# 🔧 Fix Office - Updated Console Code

Try this updated code in your browser console:

## Step 1: Test if API routes work

First, test if you can reach any API endpoint:

```javascript
fetch('/api/offices', { credentials: 'include' })
  .then(r => r.json())
  .then(data => {
    console.log('✅ API works!', data);
    alert('API connection works! Now try the fix.');
  })
  .catch(err => {
    console.error('❌ API error:', err);
    alert('Error connecting to API: ' + err.message);
  });
```

## Step 2: If Step 1 works, try the fix

```javascript
fetch('/api/debug/fix-office', { 
  method: 'POST', 
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(async r => {
  const text = await r.text();
  console.log('Response status:', r.status);
  console.log('Response text:', text.substring(0, 200));
  
  if (text.startsWith('<!DOCTYPE')) {
    alert('❌ Got HTML instead of JSON. The route might not be registered. Check Railway logs.');
    return;
  }
  
  try {
    const data = JSON.parse(text);
    if (data.success) {
      alert('✅ SUCCESS! Your office has been updated to: ' + data.user.officeName + '\n\n' + data.patientsInOffice + ' patients are in this office.\n\nNow log out and log back in!');
      console.log('Success:', data);
    } else {
      alert('Error: ' + (data.error || data.message || 'Unknown error'));
      console.error('Error:', data);
    }
  } catch (e) {
    alert('❌ Could not parse response. Got: ' + text.substring(0, 100));
    console.error('Parse error:', e);
  }
})
.catch(err => {
  alert('Error: ' + err.message);
  console.error('Error:', err);
});
```

---

## If you still get HTML:

The route might not be deployed yet. Check:
1. Railway Dashboard → web service → Logs
2. Look for any errors about `/api/debug/fix-office`
3. Make sure the latest deployment finished successfully
