"use client";

export const dynamic = "force-dynamic"; // ✅ 이 줄을 추가해서 SSR에서 오류 방지

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";

import DetailSwiper from "@/components/common/DetailSwiper";
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import KakaoMap from "@/components/common/KakaoMap";
import DetailList from "@/components/travel/DetailList";
import { TourImg, TourDetailInfo, CatList } from "@/types/types";
import APIConnect from "@/utils/api";
import catListJson from "@/utils/catList.json";
import { getCookie, setCookie } from "@/utils/cookie";

const catList = catListJson as CatList;

const TravelListPage: React.FC = () => {
   const params = useSearchParams();
   const key = Number(params.get("contentId"));

   const blankbox = (
      <span className="bg-neutral-200 rounded px-24">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
   );

   const swiperRef = useRef<any>(null); // 🔥 Swiper 인스턴스 저장
   const prevBtnRef = useRef<HTMLButtonElement | null>(null);
   const nextBtnRef = useRef<HTMLButtonElement | null>(null);

   const [infoList, setInfoList] = useState<TourDetailInfo | null>(null);
   const [imgList, setImgList] = useState<TourImg[]>([]);
   const [isFavorite, setIsFavorite] = useState(false);
   const [isVisited, setIsVisited] = useState(false);
   const [stateTrigger, setStateTrigger] = useState(0);
   const [storedUserId, setStoredUserId] = useState<string | null>(null);

   useEffect(() => {
      setStoredUserId(getCookie("userId"));
   }, []);

   useEffect(() => {
      const loadData = async () => {
         try {
            const infoList: TourDetailInfo = await APIConnect.getTourAreaInfo(key, 12);
            const img = await APIConnect.getTourImg(key);
            setInfoList(infoList);
            setImgList(img);
         } catch (error) {
            console.error("🚨 데이터 로드 실패:", error);
         }
      };
      loadData();

      if (storedUserId) {
         // ✅ 사용자별 찜 & 다녀온 여행지 데이터 로드
         const favoritePlaces = JSON.parse(getCookie(`favorites_${storedUserId}`) || "[]");
         setIsFavorite(favoritePlaces.includes(key));

         const visitedPlaces = JSON.parse(getCookie(`visited_${storedUserId}`) || "[]");
         setIsVisited(visitedPlaces.includes(key));
      }

      if (swiperRef.current && prevBtnRef.current && nextBtnRef.current) {
         swiperRef.current.params.navigation.prevEl = prevBtnRef.current;
         swiperRef.current.params.navigation.nextEl = nextBtnRef.current;
         swiperRef.current.navigation.init();
         swiperRef.current.navigation.update();
      }
   }, [key, storedUserId, stateTrigger]); // ✅ 쿠키 변경 감지 (자동 반영)

   // ✅ 찜하기 토글
   const handleFavoriteToggle = () => {
      if (!storedUserId) {
         console.warn("🚨 userId 없음. 찜 목록을 저장할 수 없음.");
         return;
      }

      let favorites = JSON.parse(getCookie(`favorites_${storedUserId}`) || "[]");

      if (isFavorite) {
         favorites = favorites.filter((id) => id !== key);
      } else {
         favorites.push(key);
      }

      setCookie(`favorites_${storedUserId}`, JSON.stringify(favorites), 7);
      setIsFavorite(!isFavorite);
      setStateTrigger((prev) => prev + 1); // ✅ 상태 변경 감지 (UI 업데이트)
   };

   // ✅ 다녀온 관광지 토글
   const handleVisitedToggle = () => {
      if (!storedUserId) {
         console.warn("🚨 userId 없음. 다녀온 관광지 목록을 저장할 수 없음.");
         return;
      }

      let visitedPlaces = JSON.parse(getCookie(`visited_${storedUserId}`) || "[]");

      if (isVisited) {
         visitedPlaces = visitedPlaces.filter((id) => id !== key);
      } else {
         visitedPlaces.push(key);
      }

      setCookie(`visited_${storedUserId}`, JSON.stringify(visitedPlaces), 7);
      setIsVisited(!isVisited);
      setStateTrigger((prev) => prev + 1); // ✅ 상태 변경 감지 (UI 업데이트)
   };

   const getContentCategory = (key: string) => {
      return (
         <>
            <span>{catList[key].cat2}</span> · <span>{catList[key].cat3}</span>
         </>
      );
   };

   const parseAnchors = (htmlString: string) => {
      const anchorRegex = /<a\s+[^>]*href="([^"]+)"[^>]*title="([^"]*)"[^>]*>(.*?)<\/a>/g;
      const anchors = [];
      let match;
      while ((match = anchorRegex.exec(htmlString)) !== null) {
         const [_, href, title, content] = match;
         anchors.push({ href, title, content });
      }
      return anchors.map((anchor, idx) => (
         <div key={idx}>
            <a href={anchor.href} title={anchor.title}>
               {""}
               {anchor.content}{" "}
            </a>
            <br />
         </div>
      ));
   };
   const convertBrToSpan = (htmlString: string) => {
      const parts = htmlString.split(/<br\s*\/?>/gi);
      return parts.map((part, idx) => <p key={idx}>{part}</p>);
   };

   return (
      <div className="min-h-screen">
         <Header />
         <main className="mx-auto max-w-screen-xl px-4 py-8 pt-[120px]">
            {/* 뒤로 가기 버튼 */}
            <div className="flex justify-start mb-4">
               <button className="flex items-center space-x-2" onClick={() => window.history.back()}>
                  <Image src="/images/goback.png" alt="뒤로 가기" width={16} height={16} />
                  <span className="text-sky-500 text-lg font-semibold">목록</span>
               </button>
            </div>

            {/* Title Section */}
            <div className="text-center">
               <h2 className="text-4xl font-bold text-neutral-800 mb-2">{infoList?.title || blankbox}</h2>
               <p className="text-xl font-normal text-neutral-800">
                  {infoList ? getContentCategory(infoList.cat3) : blankbox}
               </p>
            </div>

            {/* Image and Info */}
            <div className="flex gap-12 my-12">
               <DetailSwiper infoList={infoList} imgList={imgList} />

               <div className="flex flex-col justify-between max-w-[480] gap-12">
                  {/* Info Section */}
                  <div className="grid grid-cols-[auto_1fr] items-start gap-4">
                     <DetailList iconUrl={"/images/address.png"} title="주소">
                        {infoList ? infoList.addr : blankbox}
                     </DetailList>
                     {infoList?.infocenter && (
                        <DetailList iconUrl={"/images/tel.png"} title="문의처">
                           {infoList.infocenter}
                        </DetailList>
                     )}
                     {infoList?.homepage && (
                        <DetailList iconUrl={"/images/homepage.png"} title="홈페이지">
                           {parseAnchors(infoList.homepage)}
                        </DetailList>
                     )}
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center space-x-4">
                     {/* 다녀온 관광지 추가 버튼 */}
                     <button
                        className={`w-72 h-13 py-2 rounded-lg border ${
                           isVisited
                              ? "bg-gray-300 text-black"
                              : "bg-sky-500 text-white hover:bg-sky-600 border-sky-500"
                        }`}
                        onClick={handleVisitedToggle}>
                        <span className="font-semibold text-lg leading-7 tracking-normal">
                           {isVisited ? "다녀온 장소" : "다녀온 장소 추가"}
                        </span>
                     </button>

                     {/* 찜하기 버튼 */}
                     <button
                        className="w-28 h-13 bg-sky-50 py-2 px-4 rounded-lg border border-sky-500 hover:bg-sky-100 flex items-center justify-center"
                        onClick={handleFavoriteToggle}>
                        <Image
                           src={isFavorite ? "/images/full_heart.png" : "/images/heart.png"}
                           alt="찜하기"
                           width={24}
                           height={24}
                        />
                        <span className="ml-2 font-semibold text-lg leading-7 tracking-normal text-sky-500">찜</span>
                     </button>
                  </div>
               </div>
            </div>

            {/* 운영 정보 */}
            <section className="">
               <h3 className="text-2xl font-bold mb-6"> 운영 정보 및 편의시설</h3>
               {infoList ? (
                  <div className="grid grid-cols-[auto_1fr] items-start gap-y-5 gap-x-3">
                     {infoList && infoList.parking && (
                        <DetailList title="주차">{convertBrToSpan(infoList.parking)}</DetailList>
                     )}
                     {infoList && infoList.restdate && (
                        <DetailList title="휴일">{convertBrToSpan(infoList.restdate)}</DetailList>
                     )}
                     {infoList && infoList.usetime && (
                        <DetailList title="운영시간">{convertBrToSpan(infoList.usetime)}</DetailList>
                     )}
                     {infoList && infoList.entranceFee && (
                        <DetailList title="입장료">{convertBrToSpan(infoList.entranceFee)}</DetailList>
                     )}
                     {infoList.extraInfo.length > 0 &&
                        infoList.extraInfo.map((exInfo) => {
                           if (exInfo.infoname != "주차요금" && exInfo.infoname != "주차") {
                              return (
                                 <DetailList title={exInfo.infoname} key={exInfo.serialnum}>
                                    {convertBrToSpan(exInfo.infotext)}
                                 </DetailList>
                              );
                           }
                        })}
                  </div>
               ) : (
                  blankbox
               )}
            </section>
            <hr className="my-12" />
            {/* 소개 */}
            <section>
               <h3 className="text-2xl font-bold mb-6">소개</h3>
               <p className="text-neutral-800 leading-relaxed text-lg">{infoList?.overview || blankbox}</p>
            </section>
            <hr className="my-12" />
            {/* 위치 */}
            <section>
               <h3 className="text-2xl font-bold mb-6">위치</h3>
               {infoList?.mapx && infoList?.mapy ? (
                  <div className="h-[500px]">
                     <KakaoMap mapx={infoList.mapx} mapy={infoList.mapy} title={infoList.title} />
                  </div>
               ) : (
                  "지도 정보 없음"
               )}
            </section>
         </main>
         <Footer />
      </div>
   );
};

export default TravelListPage;
