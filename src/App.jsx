import { useState } from 'react';
import toast from 'react-hot-toast';
import { z } from 'zod';
import sha1 from 'crypto-js/sha1';

const schema = z.string().min(6, 'Password must be at least 6 characters');

function App() {
  const [password, setPassword] = useState('');
  const [hints, setHints] = useState([]);
  const [breached, setBreached] = useState(null);

  const getHints = (pwd) => {
    const newHints = [];
    if (!/[A-Z]/.test(pwd)) newHints.push('Add an uppercase letter');
    if (!/[a-z]/.test(pwd)) newHints.push('Add a lowercase letter');
    if (!/[0-9]/.test(pwd)) newHints.push('Include a number');
    if (!/[^A-Za-z0-9]/.test(pwd)) newHints.push('Add a symbol');
    if (pwd.length < 10) newHints.push('Use 10+ characters');
    return newHints;
  };

  const checkPassword = async () => {
    const result = schema.safeParse(password);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    const hash = sha1(password).toString().toUpperCase();
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    try {
      toast.loading('Checking password...');
      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      const text = await res.text();
      const lines = text.split('\n');
      const found = lines.find(line => line.startsWith(suffix));
      toast.dismiss();

      if (found) {
        setBreached(true);
        toast.error('⚠️ This password has been found in data breaches');
      } else {
        setBreached(false);
        toast.success('✅ Password not found in known breaches');
      }
    } catch (err) {
      toast.dismiss();
      toast.error('Error checking breach status');
    }
  };

  const handleChange = (e) => {
    const pwd = e.target.value;
    setPassword(pwd);
    setHints(getHints(pwd));
    setBreached(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-800 mb-4 text-center">Password Strength Checker</h1>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={handleChange}
          className="w-full border border-slate-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
        <button
          onClick={checkPassword}
          className="mt-4 w-full bg-slate-800 text-white py-2 rounded hover:bg-slate-700 transition"
        >
          Check Password
        </button>

        {hints.length > 0 && (
          <div className="mt-4 text-sm text-slate-600">
            <p className="font-medium mb-1">Hints:</p>
            <ul className="list-disc ml-5 space-y-1">
              {hints.map((hint, index) => (
                <li key={index}>{hint}</li>
              ))}
            </ul>
          </div>
        )}

        {breached !== null && (
          <div className="mt-4 text-center font-semibold text-lg">
            {breached ? (
              <span className="text-red-600">⚠️ Compromised Password</span>
            ) : (
              <span className="text-green-600">✅ Safe Password</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
