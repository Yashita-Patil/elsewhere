import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/Dialog";
import Button from "./ui/Button";
import Input from "./ui/Input";
import { useAuth } from "../context/AuthContext";
import { useModals } from "../context/ModalContext";

// One popup for both "Log in" and "Create account"
export default function LoginDialog() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { loginOpen, setLoginOpen, setDashboardOpen } = useModals();

  const [mode, setMode] = useState("login"); // "login" or "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isRegister = mode === "register";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const loggedUser = isRegister
        ? await register(name.trim(), email.trim(), password)
        : await login(email.trim(), password);
      setPassword("");
      setLoginOpen(false);
      setDashboardOpen(false);
      if (loggedUser?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/account");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    setMode(isRegister ? "login" : "register");
    setError("");
  };

  return (
    <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
      <DialogContent className="travel-dialog login-dialog">
        <DialogHeader>
          <p className="eyebrow"><span className="eyebrow-line" />{isRegister ? "Join us" : "Welcome back"}</p>
          <DialogTitle>{isRegister ? <>Start your <em>journey.</em></> : <>Come on <em>in.</em></>}</DialogTitle>
          <DialogDescription>Keep your saved places and upcoming journeys together.</DialogDescription>
        </DialogHeader>
        <form className="dialog-form" onSubmit={handleSubmit}>
          {isRegister && (
            <label>Your name
              <Input autoComplete="name" placeholder="How should we call you?" value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
          )}
          <label>Email address
            <Input autoComplete="email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>Password
            <Input
              autoComplete={isRegister ? "new-password" : "current-password"}
              type="password"
              placeholder={isRegister ? "At least 6 characters" : "Your password"}
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <Button type="submit" className="dialog-submit" disabled={busy}>
            {busy ? "Please wait…" : isRegister ? "Create my account" : "Continue to my trips"} <ArrowRight aria-hidden="true" />
          </Button>
          <button type="button" className="form-switch" onClick={switchMode}>
            {isRegister ? "Already have an account? Log in" : "New here? Create an account"}
          </button>
          <p className="fine-print">Your password is encrypted before it is stored in our database.</p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
