import { getImRole, getScRole } from '../lib/db';
import LandingClient from './LandingClient';

// Reads the login cookies on the server so anyone already unlocked this
// session skips the password prompt.
export default async function Home() {
  const [im, sc] = await Promise.all([getImRole(), getScRole()]);
  return <LandingClient imUnlocked={!!im} scUnlocked={!!sc} />;
}
