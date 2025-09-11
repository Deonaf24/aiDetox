import Image from "next/image";

const LaunchUI = () => (
  <Image
    src="/logo.png"   // path relative to the public/ folder
    alt="Company Logo"
    width={50}       // adjust size as needed
    height={50}
    priority          // optional: ensures it loads quickly
  />
);

export default LaunchUI;
