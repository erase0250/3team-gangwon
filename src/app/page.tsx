import SvgMap from "@/components/main/SvgMap";
import Footer from "../components/common/Footer";
import Header from "../components/common/Header";

export default function Home() {
  return (
    <div className="text-3xl font-bold">
      {/* Header 컴포넌트 추가 */}
      <Header />
      <SvgMap/>
      {/* Footer 컴포넌트 추가 */}
      <Footer />
    </div>
  );
}
