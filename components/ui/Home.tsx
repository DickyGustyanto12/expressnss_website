import Banner from "./Banner";

interface HomeProps {
  onBukaChat?: () => void;
}

const Home = ({ onBukaChat }: HomeProps) => {
  return (
    <div id="beranda" className="scroll-mt-24">
      <Banner onBukaChat={onBukaChat} />
    </div>
  );
};

export default Home;
