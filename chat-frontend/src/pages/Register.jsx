import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import API from "../services/api";
import { useToast } from "../context/toast";

function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await API.post("/auth/register", { name, email, password });
            toast.success("Account created successfully! Please sign in.", { 
                title: "Welcome to ChatUp!",
                duration: 4000 
            });
            navigate("/");
        } catch (err) {
            const message = err.response?.data?.message || "Registration failed. Please try again.";
            setError(message);
            toast.error(message, { title: "Registration Failed" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <h1 style={styles.logo}><MessageCircle size={28} style={{ verticalAlign: "middle", marginRight: "8px" }} />ChatUp</h1>
                    <p style={styles.subtitle}>Create your account</p>
                </div>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your full name"
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            required
                            minLength={6}
                            style={styles.input}
                        />
                    </div>

                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? "Creating account..." : "Register"}
                    </button>
                </form>

                <p style={styles.footer}>
                    Already have an account?{" "}
                    <Link to="/" style={styles.link}>
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}

const styles = {
    wrapper: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-auth-gradient)",
        fontFamily: "var(--font-family)",
        padding: "var(--space-xl)",
    },
    card: {
        background: "var(--bg-glass-strong)",
        backdropFilter: "var(--blur-xl)",
        border: "1px solid var(--border-medium)",
        borderRadius: "var(--radius-3xl)",
        padding: "var(--space-5xl) var(--space-4xl)",
        width: "100%",
        maxWidth: "420px",
        boxShadow: "var(--shadow-xl)",
    },
    header: {
        textAlign: "center",
        marginBottom: "var(--space-3xl)",
    },
    logo: {
        fontSize: "var(--fs-display)",
        fontWeight: "var(--fw-bold)",
        color: "var(--text-primary)",
        margin: "0 0 var(--space-sm) 0",
    },
    subtitle: {
        color: "var(--text-tertiary)",
        fontSize: "var(--fs-body-sm)",
        margin: 0,
    },
    error: {
        background: "var(--accent-danger-bg)",
        border: "1px solid var(--accent-danger-border)",
        color: "var(--accent-danger-light)",
        padding: "var(--space-md) var(--space-lg)",
        borderRadius: "var(--radius-lg)",
        fontSize: "var(--fs-caption)",
        marginBottom: "var(--space-xl)",
        textAlign: "center",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-xl)",
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    label: {
        color: "var(--text-secondary)",
        fontSize: "var(--fs-caption)",
        fontWeight: "var(--fw-medium)",
    },
    input: {
        background: "var(--bg-input)",
        border: "1px solid var(--border-strong)",
        borderRadius: "var(--radius-lg)",
        padding: "14px var(--space-lg)",
        fontSize: "var(--fs-body)",
        color: "var(--text-primary)",
        outline: "none",
        transition: "border-color var(--transition-smooth)",
    },
    button: {
        background: "var(--accent-gradient)",
        color: "var(--text-primary)",
        border: "none",
        borderRadius: "var(--radius-lg)",
        padding: "14px",
        fontSize: "var(--fs-body)",
        fontWeight: "var(--fw-semibold)",
        cursor: "pointer",
        marginTop: "var(--space-sm)",
        transition: "opacity var(--transition-smooth)",
    },
    footer: {
        textAlign: "center",
        color: "var(--text-tertiary)",
        fontSize: "var(--fs-caption)",
        marginTop: "var(--space-2xl)",
    },
    link: {
        color: "var(--accent-primary)",
        textDecoration: "none",
        fontWeight: "var(--fw-semibold)",
    },
};

export default Register;
