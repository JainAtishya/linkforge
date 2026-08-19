import { useState } from "react";

function Register() {
    const [form, setForm] = useState({
        name: "",
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
            <h1>Create your account</h1>

            <p>
                Start creating and managing your short URLs.
            </p>

            <form onSubmit={handleSubmit}>

                <div>
                    <label htmlFor="name">
                        Name
                    </label>

                    <input
                        id="name"
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Enter your name"
                    />
                </div>

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
                        placeholder="Create a password"
                    />
                </div>

                <button type="submit">
                    Create Account
                </button>

            </form>
        </main>
    );
}

export default Register;