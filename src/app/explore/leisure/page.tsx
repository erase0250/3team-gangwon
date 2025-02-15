"use client";

export const dynamic = "force-dynamic"; // ✅ 이 줄을 추가해서 SSR에서 오류 방지

import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

import CardList from "@/components/common/CardList";
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import LeisureSearchBar from "@/components/Leisure/LeisureSearchBar";
import { SelectedParam } from "@/types/types";

const TravelPage: React.FC = () => {
   //라우터 세팅
   const searchParams = useSearchParams();
   const router = useRouter();

   //파라미터 가지고오기
   const nowCategory = searchParams.get("cat");
   const nowFilter = searchParams.get("filter");
   const nowPage = Number(searchParams.get("page"));
   const [selected, setSelected] = useState<SelectedParam>({ cat: "", page: 1 });

   //props로 전달할 url 변환 함수
   const handleUrlChange = (selectedParam: SelectedParam) => {
      const queryString = selectedParam.filter
         ? `?cat=${selectedParam.cat}&filter=${selectedParam.filter}&page=${selectedParam.page}`
         : `?cat=${selectedParam.cat}&page=${selectedParam.page}`;
      router.push(queryString, { scroll: false });
      setSelected(selectedParam);
   };
   // 기본 파라미터 설정 (cat이 없을 경우 season으로 설정)
   useEffect(() => {
      if (!nowCategory) {
         console.log("🔄 기본 카테고리 'season' 적용");
         setSelected({ cat: "region", page: 1 });
         router.replace("?cat=region&page=1", { scroll: false });
         return;
      }

      // 올바른 카테고리 값인지 확인 후 설정
      if (["season", "region"].includes(nowCategory)) {
         setSelected({ cat: nowCategory, filter: nowFilter, page: nowPage });
      }
   }, [nowCategory, nowFilter, nowPage, router]);

   return (
      <div className="min-h-screen">
         <Header />
         <LeisureSearchBar selected={selected} changeUrl={handleUrlChange} />
         <CardList
            key={`${selected.cat}-${selected.page}-${selected.filter}`}
            selected={selected}
            changeUrl={handleUrlChange}
         />
         <Footer />
      </div>
   );
};

export default TravelPage;
