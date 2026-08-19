import { useState } from "react";

function Login() {
    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    function handleChange(event) {
        const { name, value } = event.target;

        setForm({
            ...form,
            [name]: value
        });
    }

    function handleSubmit(event) {
        event.preventDefault();

        console.log(form);
    }

    return (
        <main>
            <h1>Welcome back</h1>

            <p>
                Login to your LinkForge account.
            </p>

            <form onSubmit={handleSubmit}>

                <div>
                    <label htmlFor="email">
                        Email
                    </label>

                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                    />
                </div>

                <div>
                    <label htmlFor="password">
                        Password
                    </label>

                    <input
                        id="password"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                    />
                </div>

                <button type="submit">
                    Login
                </button>

            </form>
        </main>
    );
}

export default Login;