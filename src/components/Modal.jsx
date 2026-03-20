function Modal({ onClose, type, onSubmit, onAuthSuccess }) {
  async function handleSubmit(e) {
    e.preventDefault();
    const password = e.target.password.value;
    const username = e.target.username.value;

    if (type === "register") {
      const email = e.target.email.value;
      const response = await fetch(`http://localhost:3000/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, email }),
      });
      if (response.ok) {
        const loginResponse = await fetch(`http://localhost:3000/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });
        const loginData = await loginResponse.json();
        onAuthSuccess(loginData.token);
      }
      else {
        return alert("Login Failed");
        
      }
    }
    if (type === "login") {
      const response = await fetch(`http://localhost:3000/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      if(response.ok) {
        const loginData = await response.json();
        onAuthSuccess(loginData.token);
      }
      else{
        return alert("Login Failed");
        
      }
      
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-xl flex flex-col gap-3 relative">
        <form
          id="registrationForm"
          className="flex flex-col gap-3 p-8"
          onSubmit={handleSubmit}
        >
          <h2>{type === "register" ? "Sign Up" : "Login"}</h2>
          {type === "register" && (
            <input
              className="bg-gray-800 text-white px-4 py-2 rounded-lg outline-none w-full"
              type="email"
              name="email"
              id="email"
              placeholder="Email"
              required
            />
          )}
          <input
            className="bg-gray-800 text-white px-4 py-2 rounded-lg outline-none w-full"
            type="text"
            name="username"
            id="username"
            placeholder="Username"
            required
          />
          <input
            className="bg-gray-800 text-white px-4 py-2 rounded-lg outline-none w-full"
            type="password"
            name="password"
            id="password"
            placeholder="Password"
            required
          />
          {type === "register" && (
            <input
              className="bg-gray-800 text-white px-4 py-2 rounded-lg outline-none w-full"
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              placeholder="Confirm Password"
              required
            />
          )}
          <button
            onClick={onSubmit}
            className="bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2 rounded w-full mt-2"
            type="submit"
            id="submitButton"
          >
            Submit
          </button>
        </form>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 absolute top-0 right-2"
        >
          X
        </button>
      </div>
    </div>
  );
}

export default Modal;
