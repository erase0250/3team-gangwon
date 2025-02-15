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
import { AccommodationDetailInfo, TourImg, CatList } from "@/types/types";
import APIConnect from "@/utils/api";
import catListJson from "@/utils/catList.json";
import { getCookie, setCookie } from "@/utils/cookie";

const catList = catListJson as CatList;

const AccommodationDetailPage: React.FC = () => {
   const params = useSearchParams();
   const key = Number(params.get("contentId"));

   const blankbox = (
      <span className="bg-neutral-200 rounded px-24">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
   );

   const swiperRef = useRef<any>(null);
   const prevBtnRef = useRef<HTMLButtonElement | null>(null);
   const nextBtnRef = useRef<HTMLButtonElement | null>(null);

   const [infoList, setAccommodationInfo] = useState<AccommodationDetailInfo | null>(null);
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
         const info: AccommodationDetailInfo = await APIConnect.getAccommodationInfo(key);
         const img = await APIConnect.getTourImg(key);

         setAccommodationInfo(info);
         setImgList(img);
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
   }, [key, storedUserId, stateTrigger]);

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

   const getContentCategory = (key: string | undefined) => {
      return (
         <>
            <span>{catList[key]?.cat2 || "카테고리 없음"}</span> · <span>{catList[key]?.cat3 || "상세 없음"}</span>
         </>
      );
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

               <div className="flex flex-col justify-between max-w-[480px] gap-12">
                  {/* Info Section */}
                  <div className="grid grid-cols-[auto_1fr] items-start gap-4">
                     <DetailList iconUrl="/images/address.png" title="주소">
                        {infoList?.addr || blankbox}
                     </DetailList>
                     <DetailList iconUrl="/images/tel.png" title="문의처">
                        {infoList?.tel || blankbox}
                     </DetailList>
                     <DetailList iconUrl="/images/time.png" title="체크인 / 체크아웃">
                        {infoList ? `${infoList.checkin} / ${infoList.checkout}` : blankbox}
                     </DetailList>

                     {/* 주차 정보가 있을 경우에만 출력 */}
                     {infoList?.parking && !["", "0", "정보 없음"].includes(infoList.parking.trim()) && (
                        <DetailList iconUrl="/images/parking.png" title="주차">
                           {infoList.parking}
                        </DetailList>
                     )}

                     {/* 숙소 규모가 있을 경우에만 출력 */}
                     {infoList?.scalelodging && !["", "0", "정보 없음"].includes(infoList.scalelodging.trim()) && (
                        <DetailList iconUrl="/images/Facility.png" title="숙소 규모">
                           {infoList.scalelodging}
                        </DetailList>
                     )}

                     {/* 편의시설이 있을 경우에만 출력 */}
                     {infoList?.facilities && !["", "0", "정보 없음"].includes(infoList.facilities.trim()) && (
                        <DetailList iconUrl="/images/Facility.png" title="편의시설">
                           {infoList.facilities}
                        </DetailList>
                     )}

                     {/* 식사 가능 장소가 있을 경우에만 출력 */}
                     {infoList?.foodplace && !["", "0", "정보 없음"].includes(infoList.foodplace.trim()) && (
                        <DetailList iconUrl="/images/Facility.png" title="식사 장소">
                           {infoList.foodplace}
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

            {/* 객실 정보 (객실 데이터가 있을 경우에만 출력) */}
            {infoList?.rooms && infoList.rooms.length > 0 && (
               <section>
                  <h3 className="text-2xl font-bold mb-6">객실 정보</h3>
                  <div className="flex flex-col gap-6">
                     {infoList.rooms.map((room, index) => (
                        <DetailList key={index} title={room.roomTitle}>
                           <div className="flex flex-wrap gap-x-4">
                              {/* 객실 크기 */}
                              {room.roomSize && room.roomSize !== "0" && <p>크기: {room.roomSize}㎡</p>}

                              {/* 기본 인원 */}
                              {room.baseCapacity && room.baseCapacity !== 0 && <p>기본 인원: {room.baseCapacity}명</p>}

                              {/* 최대 인원 */}
                              {room.maxCapacity && room.maxCapacity !== 0 && <p>최대 인원: {room.maxCapacity}명</p>}

                              {/* 요금 정보 (둘 다 0이면 출력 안 함) */}
                              {(room.priceLow && room.priceLow !== "0") ||
                              (room.priceHigh && room.priceHigh !== "0") ? (
                                 <p>
                                    요금: {room.priceLow && room.priceLow !== "0" ? `${room.priceLow}원` : ""}
                                    {room.priceLow && room.priceHigh ? " ~ " : ""}
                                    {room.priceHigh && room.priceHigh !== "0" ? `${room.priceHigh}원` : ""}
                                 </p>
                              ) : null}
                           </div>
                        </DetailList>
                     ))}
                  </div>
               </section>
            )}

            <hr className="my-12" />

            {/* 소개 */}
            <section>
               <h3 className="text-2xl font-bold mb-6">숙소 소개</h3>
               <p className="text-neutral-800 leading-relaxed text-lg">{infoList?.overview || blankbox}</p>
            </section>

            <hr className="my-12" />

            {/* 위치 정보 */}
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

export default AccommodationDetailPage;
