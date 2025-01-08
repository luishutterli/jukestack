import Header from "./components/Header";

function LoginSignup() {
    return (
        <div>
            <Header />
            <div className="flex justify-center items-center h-screen">
                <div className="container border-2 shadow-lg flex flex-col p-4 items-center rounded-xl w-auto">
                    <div>
                        <h1 className="font-extrabold text-5xl bg-gradient-to-r from-primary to-secondary to-80% inline-block text-transparent bg-clip-text p-2">
                            Login
                        </h1>
                    </div>
                    <div>
                        <h3>Email:</h3>
                        <input type="text" />
                        <h3>Password:</h3>
                        <input type="password" />
                    </div>
                    <button type="button" className="bg-primary text-white p-2 rounded-lg mt-4">
                        Login
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginSignup;
