import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import hero from '../assets/hero.gif'



const ShuffleHero = () => {
  return (
    <section className="w-full pl-12 ml-12 py-12 grid-cols-1 md:grid-cols-2 items-center gap-8 max-w-6xl mx-auto">
      {/* 3D Background */}
      <div className="absolute inset-0 -z-10">
        <Canvas>
          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.25} />
          <ambientLight intensity={0.1} />
          <pointLight position={[10, 10, 10]} />
       
          <Stars
            radius={75}
            depth={35}
            count={100}
            factor={3}
            fade
            color="#030811"
          />
        </Canvas>
      </div>
      <HeroVid />
    </section>
  );
};

// Main grid component
const HeroVid = () => {
  return (
    // "hidden md:flex" hides the GIF on small screens, shows it on medium and above
    <div className="relative w-full h-[450px] flex justify-center items-center hidden md:flex hidden lg:flex ">
      <img className="w-full" alt="hero" src={hero} />
    </div>
  );
};

export default ShuffleHero;
