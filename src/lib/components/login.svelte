<script lang="ts">
  import { goto } from "$app/navigation";
  import { USER_CREDENTIALS } from "$lib/constants/auth";
  import eye_closed from '$lib/assets/eye_closed.svg';
  import eye_open from '$lib/assets/eye_open.svg';
  import Background from '$lib/components/Background.svelte';

  let showLoginForm = false;
  let loginId = "";
  let password = "";
  let error = "";

  function continueAsGuest() {
    goto("/15-minute-city");
  }

  function openSignIn() {
    showLoginForm = true;
    error = "";
  }

  function backToButtons() {
    showLoginForm = false;
    loginId = "";
    password = "";
    error = "";
  }

  function signInSubmit() {
    const user = USER_CREDENTIALS.find(
      (u) =>
        u.username === loginId.trim() &&
        u.password === password.trim()
    );

    if (!user) {
      error = "Invalid username or password";
      return;
    }

    // success
    localStorage.setItem("auth_mode", "signed_in");
    localStorage.setItem("user_role", user.role ?? "user");
    localStorage.setItem("username", user.username);

    goto("/15-minute-city");
  }

  let showPassword = false;

    function togglePassword() {
    showPassword = !showPassword;
    }

</script>


<svelte:head>
  <title>15-Minute City</title>
</svelte:head>

<div class="screen">
  <Background />
  <div class="vignette" aria-hidden="true"></div>

  <main class="card" role="main" aria-label="Login">
    <div class="title">
      <span class="pin" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
          <path
            d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"
            stroke="currentColor" stroke-width="1.8"
          />
          <path
            d="M12 12.2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
            stroke="currentColor" stroke-width="1.8"
          />
        </svg>
      </span>
      <h1>15-Minute City</h1>
    </div>

    <p class="subtitle">Explore what you can reach in 15 minutes.</p>

    {#if !showLoginForm}
      <button class="btn primary" on:click={continueAsGuest}>
        Continue as Guest
      </button>

      <div class="divider" aria-hidden="true">
        <span></span><span class="or">OR</span><span></span>
      </div>

      <button class="btn secondary" on:click={openSignIn}>
        Sign in with University / Email
      </button>
    {:else}
      <form class="form" on:submit|preventDefault={signInSubmit}>
        <label class="label">
          Login ID / Email
          <input
            class="input"
            type="email"
            placeholder="e.g. ab1234@uni-muenster.de"
            bind:value={loginId}
            autocomplete="username"
            required
            pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
            title="Please enter a valid email address"
            />
        </label>

        <label class="label">
        Password
        <div class="password-wrapper">
            <input
            class="input"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            bind:value={password}
            autocomplete="current-password"
            required
            />

            <button
            type="button"
            class="eye"
            on:click={togglePassword}
            aria-label={showPassword ? "Hide password" : "Show password"}
            >
            <img
                src={showPassword ? eye_open : eye_closed}
                alt="Toggle password visibility"
            />
            </button>
        </div>
        </label>

        {#if error}
        <div class="error" role="alert">{error}</div>
        {/if}


        <button class="btn primary" type="submit">
          Sign in
        </button>

        <button class="btn ghost" type="button" on:click={backToButtons}>
          ← Back
        </button>
      </form>
    {/if}

    <p class="footer">
      Data sources: OpenStreetMap • Accessibility model for Münster
    </p>
  </main>
</div>

<style>
  .screen{
    min-height: 100vh;
    display: grid;
    place-items: center;
    position: relative;
    overflow: hidden;
    background: #0b0f14;
    padding: 24px;
  }

  .bg{
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.55)),
      url("/images/muenster-map.jpg");
    background-size: cover;
    background-position: center;
    filter: blur(6px) saturate(1.1);
    transform: scale(1.05);
  }

  .vignette{
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center,
      rgba(0,0,0,0) 0%,
      rgba(0,0,0,0.35) 55%,
      rgba(0,0,0,0.75) 100%);
  }

  .card{
    position: relative;
    width: min(520px, 92vw);
    padding: 30px 28px 20px;
    border-radius: 22px;
    background: rgba(18, 24, 32, 0.55);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 20px 70px rgba(0,0,0,0.45);
    color: rgba(255,255,255,0.92);
  }

  .title{
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .pin{
    color: #51c7c0;
    display: inline-flex;
    translate: 0 1px;
  }

  h1{
    margin: 0;
    font-size: clamp(22px, 2.3vw, 30px);
    letter-spacing: 0.2px;
  }

  .subtitle{
    margin: 10px 0 22px;
    text-align: center;
    color: rgba(255,255,255,0.72);
    font-size: 15.5px;
  }

  .btn{
    width: 100%;
    padding: 14px 16px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    font-size: 16px;
    cursor: pointer;
    transition: transform .08s ease, filter .15s ease, background .15s ease;
    color: rgba(255,255,255,0.92);
  }

  .btn:active{ transform: translateY(1px); }

  .primary{
    background: linear-gradient(180deg, rgba(70,130,255,0.95), rgba(35,95,230,0.95));
    border-color: rgba(255,255,255,0.10);
  }
  .primary:hover{ filter: brightness(1.06); }

  .secondary{
    background: rgba(255,255,255,0.06);
  }
  .secondary:hover{ background: rgba(255,255,255,0.10); }

  .ghost{
    background: transparent;
    border-color: rgba(255,255,255,0.10);
    color: rgba(255,255,255,0.70);
  }
  .ghost:hover{ background: rgba(255,255,255,0.06); }

  .divider{
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 12px;
    margin: 14px 0;
    color: rgba(255,255,255,0.45);
    font-size: 12px;
    letter-spacing: 2px;
  }
  .divider span:first-child,
  .divider span:last-child{
    height: 1px;
    background: rgba(255,255,255,0.12);
  }
  .or{ padding: 4px 8px; }

  /* form */
  .form{
    display: grid;
    gap: 12px;
    margin-top: 6px;
  }

  .label{
    display: grid;
    gap: 6px;
    font-size: 13px;
    color: rgba(255,255,255,0.75);
  }

  .input{
    width: 100%;
    padding: 12px 12px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(0,0,0,0.35);
    color: rgba(255,255,255,0.92);
    outline: none;
  }
  .input:focus{
    border-color: rgba(81,199,192,0.55);
    box-shadow: 0 0 0 3px rgba(81,199,192,0.12);
  }

 .error {
  margin-top: 6px;
  font-size: 13px;
  text-align: left;
  color: rgba(255, 120, 120, 0.85);
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper .input {
  padding-right: 44px;
}

.eye {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.eye img {
  width: 18px;
  height: 18px;
  opacity: 0.6;
  filter: invert(70%) sepia(0%) saturate(0%) brightness(85%);
}

.eye:hover img {
  opacity: 0.9;
  filter: invert(80%) sepia(0%) saturate(0%) brightness(95%);
}

 .footer{
    margin: 18px 0 0;
    text-align: center;
    font-size: 12.5px;
    color: rgba(255,255,255,0.55);
  }
</style>
