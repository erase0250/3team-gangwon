import axios from "axios";
import dotenv from "dotenv";

import { TourImg, TourDetailInfo, RestaurantDetailInfo, TourItemRegion } from "@/types/types";
import { AccommodationItem, AccommodationDetailInfo } from "@/types/types";


dotenv.config();
import natureList from "./natureList.json";
import seasonList from "./seasonList.json";

// 인터페이스 정의
interface TourItem {
   title: string; // 관광지 이름
   addr1: string; // 주소
   firstimage?: string; // 대표 이미지 URL
   mapx?: number; // X 좌표 (경도)
   mapy?: number; // Y 좌표 (위도)
   contentid: number; // 콘텐츠 ID
   contenttypeid: number; // 콘텐츠 타입 ID
}

export default class APIConnect {
   static serviceName: string = "GangwonGo";
   private static _tourDefaultURL: string = "http://apis.data.go.kr/B551011/KorService1/";
   private static _backDefaultURL: string = "http://13.209.75.182:5003/";
   private static _tourKey: string = process.env.NEXT_PUBLIC_TOUR_SERVICE_KEY || "";

   private static _tourDefaultOption = {
      MobileOS: "ETC",
      MobileApp: this.serviceName,
      serviceKey: this._tourKey,
      numOfRows: 1000,
      _type: "json",
   };

   //Travel Page
   /**
    * TourAPI에서 지역별 List를 가지고오는 메서드입니다.
    * @param {string} code - 시군구 코드
    * @param {number} page - 불러올 페이지. 기본값은 1입니다.
    * @returns {Array} 인덱스 이미지, 시군구 정보, 제목으로 구성된 12개의 정보 리스트를 반환합니다.
    */
   static async getTourAreaList(code: string | undefined): Promise<TourItem[]> {
      let allItems: TourItem[] = [];
      let page = 1;
      let totalItems = 0;
  
      try {
          while (true) {
              const response = await axios.get(this._tourDefaultURL + "areaBasedList1", {
                  params: {
                      ...this._tourDefaultOption,
                      pageNo: page,  
                      numOfRows: 1000,  // ✅ 최대 1000개 가져오기
                      areaCode: 32,
                      sigunguCode: code,
                      listYN: "Y",
                  },
              });
  
              if (response.status !== 200) {
                  throw new Error(`HTTP Error: ${response.status} - 데이터를 불러오지 못했습니다.`);
              }
  
              if (!response.data.response || !response.data.response.body.items.item) {
                  console.log("⚠️ API에서 데이터를 가져오지 못했습니다.");
                  break;
              }
  
              const fetchedItems = response.data.response.body.items.item;
              totalItems += fetchedItems.length;
              allItems = [...allItems, ...fetchedItems];
  
              console.log(`📌 ${page}페이지 - ${fetchedItems.length}개 로드 완료 (총: ${totalItems})`);
  
              // ✅ 더 이상 가져올 데이터가 없으면 반복 종료
              if (fetchedItems.length < 1000) {
                  break;
              }
  
              page++; // ✅ 다음 페이지 요청
          }
  
          console.log(`✅ 모든 데이터를 가져왔습니다. 총 개수: ${allItems.length}`);
          return allItems;
      } catch (error) {
          console.error("🚨 getTourAreaList 오류:", error);
          return [];
      }
  }
  
   static async getTourAreaInfo(
      contentId: number | string,
      contentTypeId: number | string = 12,
   ): Promise<TourDetailInfo> {
      try {
         const responseCommon = await axios.get(this._tourDefaultURL + "detailCommon1", {
            params: {
               ...this._tourDefaultOption,
               contentId: contentId,
               defaultYN: "Y",
               firstImageYN: "Y",
               areacodeYN: "Y",
               catcodeYN: "Y",
               addrinfoYN: "Y",
               mapinfoYN: "Y",
               overviewYN: "Y",
            },
         });
         const responseIntro = await axios.get(this._tourDefaultURL + "detailIntro1", {
            params: {
               ...this._tourDefaultOption,
               contentId: contentId,
               contentTypeId: contentTypeId,
            },
         });
         const responseInfo = await axios.get(this._tourDefaultURL + "detailInfo1", {
            params: {
               ...this._tourDefaultOption,
               contentId: contentId,
               contentTypeId: contentTypeId,
            },
         });

         if (responseCommon.status !== 200 || responseIntro.status !== 200 || responseInfo.status !== 200) {
            throw new Error(
               `HTTP Error: ${
                  responseCommon.status || responseIntro.status || responseInfo.status
               } - 데이터를 불러오지 못했습니다.`,
            );
         }

         console.log("Tour Detail Info 조회 중... ... ...");
         console.log("Response Common : ", responseCommon.data.response.body.items.item);
         console.log("response Intro", responseIntro.data.response.body.items.item);
         console.log("response Info", responseInfo.data.response.body.items.item);

         const commonData = responseCommon.data.response.body.items.item[0];
         const introData = responseIntro.data.response.body.items.item
            ? responseIntro.data.response.body.items.item[0]
            : {};
         const infoData = responseInfo.data.response.body.items.item || {};

         return {
            contentid: commonData.contentid,
            cat1: commonData.cat1,
            cat2: commonData.cat2,
            cat3: commonData.cat3,
            title: commonData.title,
            overview: commonData.overview,
            homepage: commonData.homepage || "",
            firstimage: commonData.firstimage || "",
            firstimage2: commonData.firstimage2 || "",
            infocenter: introData.infocenter || "",
            entranceFee: infoData.infotext || "",
            restdate: introData.restdate || "",
            useseason: introData.useseason || "",
            usetime: introData.usetime || "",
            //편의시설
            chkbabycarriage: introData.chkbabycarriage || "",
            parking: introData.parking || "",
            extraInfo: infoData || "",
            //위치
            addr: commonData.addr1,
            mapx: commonData.mapx,
            mapy: commonData.mapy,
         };
      } catch (err) {
         throw new Error(`Axios 요청이 실패했습니다 : ${err}`);
      }
   }

   /**
    * TourAPI에서 상세 이미지를 가지고 오는 메서드입니다. 음식점 타입의 경우  메뉴 이미지를 불러옵니다.
    * @param {string} contentId - 콘텐츠 고유 ID
    * @returns {Array} 이미지 정보가 담긴 배열을 반환합니다.
    */
   static async getTourImg(contentId: number): Promise<TourImg[]> {
      try {
         const response = await axios.get(this._tourDefaultURL + "detailImage1", {
            params: {
               ...this._tourDefaultOption,
               contentId: contentId,
               imageYN: "Y",
               subImageYN: "Y",
            },
         });
         if (response.status !== 200) {
            throw new Error(`HTTP Error: ${response.status} - 데이터를 불러오지 못했습니다.`);
         }
         return response.data.response.body.items.item;
      } catch (err) {
         throw new Error(`Axios 요청이 실패했습니다: ${err}`);
      }
   }

   /**
    * TourAPI에서 계절별 관광지 리스트를 가져오는 메서드
    *
    * @param {string | null} season - 불러올 계절 ("spring", "summer", "autumn", "winter") | null (전체)
    * @param {number} page
    * @returns {Promise<TourItem[]>}
    */
   static async getSeasonTourList(
      season: "spring" | "summer" | "autumn" | "winter" | null,
      page: number = 1,
   ): Promise<TourItem[]> {
      try {
         console.log(
            `📌 [API 요청] ${season ? `${season} 관광지` : "전체 계절 관광지"} 리스트 가져오기, 페이지: ${page}`,
         );

         // 선택된 계절이 없으면 모든 계절 데이터 병합
         const selectedSeasons: Array<keyof typeof seasonList> = season
            ? [season]
            : ["spring", "summer", "autumn", "winter"];

         const cat3List = selectedSeasons.flatMap((seasonKey) => seasonList[seasonKey] || []);

         if (cat3List.length === 0) {
            console.warn(`⚠️ ${season ? season : "전체"} 시즌 관광지 데이터가 없습니다.`);
            return [];
         }

         // API 요청 리스트 생성
         const requests = cat3List.map(({ cat1, cat2, cat3 }) =>
            axios
               .get(this._tourDefaultURL + "areaBasedList1", {
                  params: {
                     ...this._tourDefaultOption,
                     pageNo: page,
                     areaCode: 32,
                     listYN: "Y",
                     cat1,
                     cat2,
                     cat3,
                  },
               })
               .then((response) => response.data?.response?.body?.items?.item || [])
               .catch((error) => {
                  console.error(`❌ [API 요청 실패] cat1=${cat1}, cat2=${cat2}, cat3=${cat3}`, error);
                  return [];
               }),
         );

         const results = await Promise.allSettled(requests);
         const mergedResults = results
            .filter((result) => result.status === "fulfilled")
            .flatMap((result) => (result as PromiseFulfilledResult<TourItem[]>).value);

         console.log(`📩 [API 응답 완료] ${mergedResults.length}개의 관광지 데이터 반환`);
         return mergedResults;
      } catch (err) {
         console.error(`❌ [API 요청 실패]`, err);
         throw new Error(`API 요청 실패: ${err}`);
      }
   }

   /**
    * TourAPI에서 자연별 관광지 리스트를 가져오는 메서드
    *
    * @param {keyof typeof natureList} natureCategory - 불러올 자연 카테고리 ("beach", "mountain", "lake", "forest") | null (전체)
    * @param {number} page
    * @returns {Promise<TourItem[]>}
    */
   static async getNatureTourList(
      natureCategory: keyof typeof natureList | null,
      page: number = 1,
   ): Promise<TourItem[]> {
      try {
         console.log(
            `📌 [API 요청] ${
               natureCategory ? `${natureCategory} 관광지` : "전체 자연 관광지"
            } 리스트 가져오기, 페이지: ${page}`,
         );

         // 선택된 카테고리가 없으면 모든 자연 데이터 병합
         const selectedCategories: Array<keyof typeof natureList> = natureCategory
            ? [natureCategory]
            : ["ocean", "mountain", "river", "forest"];

         const cat3List = selectedCategories.flatMap((category) => natureList[category] || []);

         if (cat3List.length === 0) {
            console.warn(`⚠️ ${natureCategory ? natureCategory : "전체"} 자연별 관광지 데이터가 없습니다.`);
            return [];
         }

         // API 요청 리스트 생성
         const requests = cat3List.map(({ cat1, cat2, cat3 }) =>
            axios
               .get(this._tourDefaultURL + "areaBasedList1", {
                  params: {
                     ...this._tourDefaultOption,
                     pageNo: page,
                     areaCode: 32,
                     listYN: "Y",
                     cat1,
                     cat2,
                     cat3,
                  },
               })
               .then((response) => response.data?.response?.body?.items?.item || [])
               .catch((error) => {
                  console.error(`❌ [API 요청 실패] cat1=${cat1}, cat2=${cat2}, cat3=${cat3}`, error);
                  return [];
               }),
         );

         const results = await Promise.allSettled(requests);
         const mergedResults = results
            .filter((result) => result.status === "fulfilled")
            .flatMap((result) => (result as PromiseFulfilledResult<TourItem[]>).value);

         console.log(`📩 [API 응답 완료] ${mergedResults.length}개의 관광지 데이터 반환`);
         return mergedResults;
      } catch (err) {
         console.error(`❌ [API 요청 실패]`, err);
         throw new Error(`API 요청 실패: ${err}`);
      }
   }

   /**
    * TourAPI에서 축제 정보를 가져오는 메서드입니다.
    * @param {string} eventStartDate - 축제 시작일 (YYYYMMDD 형식, 기본값: '20240101').
    * @param {string} eventEndDate - 축제 종료일 (YYYYMMDD 형식, 기본값: 없음).
    * @param {number} page - 불러올 페이지 (기본값: 1).
    * @param {string} sigunguCode - 시군구 코드 (선택, 기본값: '').
    * @returns {Promise<object[]>} 축제 정보 리스트를 반환합니다.
    */
   static async getFestivalList(
      eventStartDate: string = "20240101",
      eventEndDate?: string,
      page: number = 1,
      sigunguCode: string = "",
   ): Promise<{ totalLength: number; items: object[] }> {
      try {
         console.log(`🔍 API 요청 중 (페이지: ${page})`);

         // 1차 요청: 전체 개수를 가져오기 위해 한 개만 요청
         const firstResponse = await axios.get(this._tourDefaultURL + "searchFestival1", {
            params: {
               ...this._tourDefaultOption,
               eventStartDate,
               eventEndDate,
               pageNo: 1,
               areaCode: 32,
               sigunguCode,
               listYN: "Y",
               numOfRows: 1, // -> 1개만 가져와서 totalLength 확인
            },
         });

         if (!firstResponse.data || !firstResponse.data.response || !firstResponse.data.response.body) {
            console.warn("⚠️ API 응답 데이터가 올바르지 않음:", firstResponse.data);
            return { totalLength: 0, items: [] };
         }

         const totalLength = firstResponse.data.response.body.totalCount || 0;
         console.log(`📢 전체 데이터 개수: ${totalLength}`);

         // 2차 요청: totalLength 만큼 데이터를 가져오기
         const response = await axios.get(this._tourDefaultURL + "searchFestival1", {
            params: {
               ...this._tourDefaultOption,
               eventStartDate,
               eventEndDate,
               pageNo: 1, // -> 1페이지에서 전체 데이터 가져오기
               areaCode: 32,
               sigunguCode,
               listYN: "Y",
               numOfRows: totalLength, // -> API가 지원하는 최대 데이터 개수만큼 요청
            },
         });

         console.log("📩 API 응답 데이터:", response.data);

         if (!response.data || !response.data.response || !response.data.response.body) {
            console.warn("⚠️ 응답 데이터 구조가 다릅니다:", response.data);
            return { totalLength: 0, items: [] };
         }

         const festivalList = response.data.response.body.items?.item || [];

         return { totalLength, items: festivalList };
      } catch (err) {
         console.error("❌ API 요청 실패:", err);
         return { totalLength: 0, items: [] };
      }
   }
   /**
    * 개별 축제 정보를 가져오는 API
    */
   static async getFestivalInfo(contentId: number | string): Promise<TourDetailInfo> {
      try {
         const responseCommon = await axios.get(this._tourDefaultURL + "detailCommon1", {
            params: {
               ...this._tourDefaultOption,
               contentId,
               contentTypeId: 15,
               defaultYN: "Y",
               firstImageYN: "Y",
               areacodeYN: "Y",
               catcodeYN: "Y",
               addrinfoYN: "Y",
               mapinfoYN: "Y",
               overviewYN: "Y",
            },
         });

         const responseIntro = await axios.get(this._tourDefaultURL + "detailIntro1", {
            params: {
               ...this._tourDefaultOption,
               contentId,
               contentTypeId: 15,
            },
         });

         const responseInfo = await axios.get(this._tourDefaultURL + "detailInfo1", {
            params: {
               ...this._tourDefaultOption,
               contentId,
               contentTypeId: 15,
            },
         });

         if (responseCommon.status !== 200 || responseIntro.status !== 200 || responseInfo.status !== 200) {
            throw new Error("축제 데이터를 가져오는 도중 오류 발생");
         }

         const commonData = responseCommon.data.response.body.items.item[0];
         const introData = responseIntro.data.response.body.items.item[0] || {};
         const infoData = responseInfo.data.response.body.items.item || [];

         return {
            contentid: commonData.contentid,
            cat3: commonData.cat3,
            title: commonData.title,
            overview: commonData.overview,
            homepage: commonData.homepage || "",
            firstimage: commonData.firstimage || "",
            firstimage2: commonData.firstimage2 || "",
            infocenter: commonData.tel || introData.sponsor1tel || "",
            entranceFee: introData.usetimefestival || "무료",
            restdate: "",
            usetime: introData.playtime || "정보 없음",
            addr: commonData.addr1,
            mapx: commonData.mapx,
            mapy: commonData.mapy,
            extraInfo: infoData,
         };
      } catch (err) {
         throw new Error(`Axios 요청이 실패했습니다: ${err}`);
      }
   }

   /**
    * TourAPI에서 공연 및 행사 정보를 가져오는 메서드입니다.
    * @param {string} eventStartDate - 행사 시작일 (YYYYMMDD 형식, 기본값: '20240101').
    * @param {string} eventEndDate - 행사 종료일 (YYYYMMDD 형식, 기본값: 없음).
    * @param {number} page - 불러올 페이지 (기본값: 1).
    * @param {string} sigunguCode - 시군구 코드 (선택, 기본값: '').
    * @returns {Promise<object[]>} 공연 및 행사 정보 리스트를 반환합니다.
    */
   static async getPerformanceEventList(
      eventStartDate: string = "20240101",
      eventEndDate?: string,
      page: number = 1,
      sigunguCode: string = "",
   ): Promise<object[]> {
      try {
         // 요청 보내기 (공연 & 행사 A0208)
         const response = await axios.get(this._tourDefaultURL + "searchFestival1", {
            params: {
               ...this._tourDefaultOption,
               eventStartDate,
               eventEndDate,
               pageNo: page,
               areaCode: 32, // 강원도 지역 코드
               sigunguCode,
               listYN: "Y",
               cat1: "A02", // 대분류: 행사/공연/축제
               cat2: "A0208", // 중분류: 공연 & 행사
            },
         });

         if (response.status !== 200) {
            throw new Error(`HTTP Error: ${response.status} - 데이터를 불러오지 못했습니다.`);
         }

         return response.data.response.body.items.item || [];
      } catch (err) {
         console.error("getPerformanceEventList 요청 실패:", err);
         throw new Error(`Axios 요청이 실패했습니다: ${err}`);
      }
   }

   /**
    * 개별 공연 & 행사 정보를 가져오는 API
    */
   static async getPerformanceEventInfo(contentId: number | string): Promise<TourDetailInfo> {
      try {
         const responseCommon = await axios.get(this._tourDefaultURL + "detailCommon1", {
            params: {
               ...this._tourDefaultOption,
               contentId,
               contentTypeId: 15, // 공연 & 행사도 동일한 contentTypeId 사용
               defaultYN: "Y",
               firstImageYN: "Y",
               areacodeYN: "Y",
               catcodeYN: "Y",
               addrinfoYN: "Y",
               mapinfoYN: "Y",
               overviewYN: "Y",
            },
         });

         const responseIntro = await axios.get(this._tourDefaultURL + "detailIntro1", {
            params: {
               ...this._tourDefaultOption,
               contentId,
               contentTypeId: 15,
            },
         });

         const responseInfo = await axios.get(this._tourDefaultURL + "detailInfo1", {
            params: {
               ...this._tourDefaultOption,
               contentId,
               contentTypeId: 15,
            },
         });

         if (responseCommon.status !== 200 || responseIntro.status !== 200 || responseInfo.status !== 200) {
            throw new Error("공연 & 행사 데이터를 가져오는 도중 오류 발생");
         }

         const commonData = responseCommon.data.response.body.items.item[0];
         const introData = responseIntro.data.response.body.items.item[0] || {};
         const infoData = responseInfo.data.response.body.items.item || [];

         return {
            contentid: commonData.contentid,
            cat3: commonData.cat3,
            title: commonData.title,
            overview: commonData.overview,
            homepage: commonData.homepage || "",
            firstimage: commonData.firstimage || "",
            firstimage2: commonData.firstimage2 || "",
            infocenter: commonData.tel || introData.sponsor1tel || "",
            entranceFee: introData.usetimefestival || "무료",
            restdate: "",
            usetime: introData.playtime || "정보 없음",
            addr: commonData.addr1,
            mapx: commonData.mapx,
            mapy: commonData.mapy,
            extraInfo: infoData,
         };
      } catch (err) {
         throw new Error(`Axios 요청이 실패했습니다: ${err}`);
      }
   }

   /**
    * 음식점 목록을 가져오는 메서드
    * @param {number} page - 불러올 페이지 번호 (기본값: 1)
    * @returns {Promise<object[]>} 음식점 목록을 반환
    */
   static async getRestaurantList(
      page: number = 1,
      numOfRows: number = 1000, // 기본값을 1000으로 설정
   ): Promise<{ items: object[]; totalCount: number }> {
      try {
         const response = await axios.get(this._tourDefaultURL + "areaBasedList1", {
            params: {
               ...this._tourDefaultOption,
               pageNo: page,
               numOfRows: numOfRows,
               areaCode: 32,
               contentTypeId: 39,
               cat1: "A05",
               cat2: "A0502",
               listYN: "Y",
            },
         });

         if (response.status !== 200) {
            throw new Error(`HTTP Error: ${response.status} - 데이터를 불러오지 못했습니다.`);
         }

         const items = response.data.response.body.items.item || [];
         const totalCount = Number(response.data.response.body.totalCount) || 0;
         return { items, totalCount };
      } catch (err) {
         throw new Error(`Axios 요청이 실패했습니다: ${err}`);
      }
   }

   /**
    * 특정 음식점의 상세 정보를 가져오는 메서드
    * @param {number} contentId - 음식점 고유 ID
    * @returns {Promise<RestaurantDetailInfo>} 음식점 상세 정보를 반환
    */
   static async getRestaurantInfo(contentId: number): Promise<RestaurantDetailInfo> {
      try {
         const responseCommon = await axios.get(this._tourDefaultURL + "detailCommon1", {
            params: {
               ...this._tourDefaultOption,
               contentId,
               contentTypeId: 39,
               defaultYN: "Y",
               firstImageYN: "Y",
               areacodeYN: "Y",
               catcodeYN: "Y",
               addrinfoYN: "Y",
               mapinfoYN: "Y",
               overviewYN: "Y",
            },
         });

         const responseIntro = await axios.get(this._tourDefaultURL + "detailIntro1", {
            params: {
               ...this._tourDefaultOption,
               contentId,
               contentTypeId: 39,
            },
         });

         const responseInfo = await axios.get(this._tourDefaultURL + "detailInfo1", {
            params: {
               ...this._tourDefaultOption,
               contentId,
               contentTypeId: 39,
            },
         });

         if (responseCommon.status !== 200 || responseIntro.status !== 200 || responseInfo.status !== 200) {
            throw new Error("음식점 데이터를 가져오는 도중 오류 발생");
         }

         const commonData = responseCommon.data.response.body.items.item[0];
         const introData = responseIntro.data.response.body.items.item[0] || {};
         const infoData = responseInfo.data.response.body.items.item || [];

         return {
            contentid: commonData.contentid,
            cat2: commonData.cat2,
            cat3: commonData.cat3,
            title: commonData.title,
            overview: commonData.overview,
            addr: commonData.addr1,
            firstimage: commonData.firstimage || "",
            homepage: commonData.homepage || "",
            infocenterfood: introData.infocenterfood || "",
            opentimefood: introData.opentimefood || "",
            restdatefood: introData.restdatefood || "",
            parkingfood: introData.parkingfood || "",
            firstmenu: introData.firstmenu || "",
            treatmenu: introData.treatmenu || "",
            mapx: commonData.mapx || "",
            mapy: commonData.mapy || "",
            extraInfo: infoData,
         };
      } catch (err) {
         throw new Error(`Axios 요청이 실패했습니다: ${err}`);
      }
   }

   /**
    * 지역기반 레저 리스트를 가져오는 메서드
    * @param {number} code - 불러올 페이지 (기본값: 1)
    * @param {number} page - 불러올 페이지 (기본값: 1)
    * @returns {Promise<TourItem[]>} 레저 리스트를 반환
    */
   static async getLeisureList(code: string | number, page: number = 1): Promise<TourItemRegion> {
      try {
         const response = await axios.get(this._tourDefaultURL + "areaBasedList1", {
            params: {
               ...this._tourDefaultOption,
               pageNo: page,
               areaCode: 32,
               sigunguCode: code,
               contentTypeId: 28,
               cat1: "A03",
               listYN: "Y",
            },
         });

         if (response.status !== 200) {
            throw new Error(`HTTP Error: ${response.status} - 데이터를 불러오지 못했습니다.`);
         }
         if (!response.data.response) {
            const isLitimed = /limited|number|requests/i.test(response.data);
            if (isLitimed) {
               console.log(`⚠️ API 요청 횟수를 초과하였습니다.`);
            }
            return { totalLength: "0", items: [] };
         } else {
            return {
               totalLength: response.data.response.body.totalCount,
               items: response.data.response.body.items.item,
            };
         }
      } catch (err) {
         throw new Error(`Axios 요청이 실패했습니다: ${err}`);
      }
   }

   /**
    * TourAPI에서 계절별 레저 리스트를 가져오는 메서드
    *
    * @param {string | null} season - 불러올 계절 ("spring", "summer", "autumn", "winter") | null (전체)
    * @param {number} page
    * @returns {Promise<TourItem[]>}
    */
   static async getSeasonLeisureList(
      season: "spring" | "summer" | "autumn" | "winter" | null,
      page: number = 1,
   ): Promise<TourItem[]> {
      try {
         console.log(
            `📌 [API 요청] ${season ? `${season} 관광지` : "전체 계절 관광지"} 리스트 가져오기, 페이지: ${page}`,
         );

         // 선택된 계절이 없으면 모든 계절 데이터 병합
         const selectedSeasons: Array<keyof typeof seasonList> = season
            ? [season]
            : ["spring", "summer", "autumn", "winter"];

         const cat3List = selectedSeasons.flatMap((seasonKey) => seasonList[seasonKey] || []);

         if (cat3List.length === 0) {
            console.warn(`⚠️ ${season ? season : "전체"} 시즌 관광지 데이터가 없습니다.`);
            return [];
         }

         // API 요청 리스트 생성
         const requests = cat3List.map(({ cat2, cat3 }) =>
            axios
               .get(this._tourDefaultURL + "areaBasedList1", {
                  params: {
                     ...this._tourDefaultOption,
                     pageNo: page,
                     areaCode: 32,
                     listYN: "Y",
                     cat1: "A03",
                     cat2,
                     cat3,
                  },
               })
               .then((response) => response.data?.response?.body?.items?.item || [])
               .catch((error) => {
                  console.error(`❌ [API 요청 실패] cat2=${cat2}, cat3=${cat3}`, error);
                  return [];
               }),
         );

         const results = await Promise.allSettled(requests);
         const mergedResults = results
            .filter((result) => result.status === "fulfilled")
            .flatMap((result) => (result as PromiseFulfilledResult<TourItem[]>).value);

         console.log(`📩 [API 응답 완료] ${mergedResults.length}개의 관광지 데이터 반환`);
         return mergedResults;
      } catch (err) {
         console.error(`❌ [API 요청 실패]`, err);
         throw new Error(`API 요청 실패: ${err}`);
      }
   }

   /**
    * 특정 레저 정보(개별 상세 정보)를 가져오는 메서드
    * @param {number} contentId - 레저 고유 ID
    * @returns {Promise<TourDetailInfo>} 레저 상세 정보를 반환
    */
   static async getLeisureInfo(contentId: number): Promise<TourDetailInfo> {
      try {
         const responseCommon = await axios.get(this._tourDefaultURL + "detailCommon1", {
            params: {
               ...this._tourDefaultOption,
               contentId,
               contentTypeId: 28,
               defaultYN: "Y",
               firstImageYN: "Y",
               areacodeYN: "Y",
               catcodeYN: "Y",
               addrinfoYN: "Y",
               mapinfoYN: "Y",
               overviewYN: "Y",
            },
         });

         const responseIntro = await axios.get(this._tourDefaultURL + "detailIntro1", {
            params: {
               ...this._tourDefaultOption,
               contentId,
               contentTypeId: 28,
            },
         });

         const responseInfo = await axios.get(this._tourDefaultURL + "detailInfo1", {
            params: {
               ...this._tourDefaultOption,
               contentId,
               contentTypeId: 28,
            },
         });

         if (responseCommon.status !== 200 || responseIntro.status !== 200 || responseInfo.status !== 200) {
            throw new Error("레저 데이터를 가져오는 도중 오류 발생");
         }

         const commonData = responseCommon.data.response.body.items.item[0];
         const introData = responseIntro.data.response.body.items.item[0] || {};
         const infoData = responseInfo.data.response.body.items.item || [];

         return {
            contentid: commonData.contentid,
            cat3: commonData.cat3,
            title: commonData.title,
            overview: commonData.overview,
            homepage: commonData.homepage || "",
            firstimage: commonData.firstimage || "",
            firstimage2: commonData.firstimage2 || "",
            infocenter: introData.infocenterleports || "",
            restdate: introData.restdateleports || "",
            usetime: introData.usetimeleports || "",
            parking: introData.parkingleports || "",
            extraInfo: infoData,
            addr: commonData.addr1,
            mapx: commonData.mapx,
            mapy: commonData.mapy,
         };
      } catch (err) {
         throw new Error(`Axios 요청이 실패했습니다: ${err}`);
      }
   }

   /**
    * 숙소 리스트 조회 API
    * @param {number} page - 페이지 번호 (기본값: 1)
    * @returns {Promise<AccommodationItem[]>} 숙소 리스트 반환
    */
   static async getAccommodationList(page: number = 1, numOfRows: number = 1000): Promise<AccommodationItem[]> {
      try {
         const response = await axios.get(this._tourDefaultURL + "searchStay1", {
            params: {
               ...this._tourDefaultOption,
               pageNo: page,
               numOfRows: numOfRows,
               areaCode: 32,
               listYN: "Y",
            },
         });

         if (response.status !== 200) {
            throw new Error(`HTTP Error: ${response.status} - 데이터를 불러오지 못했습니다.`);
         }

         return response.data.response.body.items.item || [];
      } catch (error) {
         console.error("숙소 리스트 가져오기 실패:", error);
         return [];
      }
   }

   /**
    * 개별 숙소 상세 정보 조회 API
    * @param {number | string} contentId - 숙소 ID
    * @returns {Promise<AccommodationDetailInfo>} 숙소 상세 정보 반환
    */
   static async getAccommodationInfo(contentId: number | string): Promise<AccommodationDetailInfo> {
      try {
         // 기본 상세 정보
         const responseCommon = await axios.get(this._tourDefaultURL + "detailCommon1", {
            params: {
               ...this._tourDefaultOption,
               contentId,
               contentTypeId: 32,
               defaultYN: "Y",
               firstImageYN: "Y",
               areacodeYN: "Y",
               catcodeYN: "Y",
               addrinfoYN: "Y",
               mapinfoYN: "Y",
               overviewYN: "Y",
            },
         });

         // 추가 상세 정보 (객실, 편의시설 등)
         const responseIntro = await axios.get(this._tourDefaultURL + "detailIntro1", {
            params: {
               ...this._tourDefaultOption,
               contentId,
               contentTypeId: 32,
            },
         });

         // 개별 객실 정보
         const responseInfo = await axios.get(this._tourDefaultURL + "detailInfo1", {
            params: {
               ...this._tourDefaultOption,
               contentId,
               contentTypeId: 32,
            },
         });

         if (responseCommon.status !== 200 || responseIntro.status !== 200 || responseInfo.status !== 200) {
            throw new Error("숙소 데이터를 가져오는 도중 오류 발생");
         }

         const commonData = responseCommon.data.response.body.items.item[0];
         const introData = responseIntro.data.response.body.items.item[0] || {};
         const infoData = responseInfo.data.response.body.items.item || [];

         return {
            contentid: commonData.contentid,
            cat2: commonData.cat2 || "",
            cat3: commonData.cat3 || "",
            title: commonData.title,
            overview: commonData.overview,
            homepage: commonData.homepage || "",
            firstimage: commonData.firstimage || "",
            firstimage2: commonData.firstimage2 || "",
            tel: commonData.tel || introData.infocenterlodging || "",
            addr: commonData.addr1,
            mapx: commonData.mapx,
            mapy: commonData.mapy,
            checkin: introData.checkintime || "확인 필요",
            checkout: introData.checkouttime || "확인 필요",
            parking: introData.parkinglodging || "정보 없음",
            facilities: introData.subfacility || "정보 없음",
            foodplace: introData.foodplace || "정보 없음",
            scalelodging: introData.scalelodging || "정보 없음",
            rooms: infoData.map((room) => ({
               roomTitle: room.roomtitle,
               roomSize: room.roomsize2,
               baseCapacity: room.roombasecount,
               maxCapacity: room.roommaxcount,
               priceLow: room.roomoffseasonminfee1,
               priceHigh: room.roompeakseasonminfee1,
               amenities: {
                  bath: room.roombathfacility === "Y",
                  airConditioning: room.roomaircondition === "Y",
                  tv: room.roomtv === "Y",
                  internet: room.roominternet === "Y",
                  refrigerator: room.roomrefrigerator === "Y",
                  toiletries: room.roomtoiletries === "Y",
                  hairdryer: room.roomhairdryer === "Y",
               },
               images: [room.roomimg1, room.roomimg2, room.roomimg3, room.roomimg4, room.roomimg5].filter((img) => img),
            })),
         };
      } catch (error) {
         throw new Error(`숙소 정보 가져오기 실패: ${error}`);
      }
   }

   /**
    * TourAPI에서 문화·역사별 관광지 전체 리스트를 가져오는 메서드
    *
    * @param {number} page - 불러올 페이지 번호. 기본값은 1
    * @returns {Promise<TourItem[]>}
    */
   static async getHistoricalTourList(page: number = 1): Promise<TourItem[]> {
      try {
         console.log("📌 [API 요청] 문화·역사 관광지 전체 리스트 요청");

         // 각각의 카테고리 데이터를 가져오는 요청
         const museumPromise = this.getMuseumTourList(page); // 미술관·박물관
         const historicPromise = this.getHistoricTourList(page); // 유적지
         const religionPromise = this.getRegionSitesData(page); // 종교 관광지
         const etcPromise = this.getEtcSitesData(page); // 기타

         // 모든 요청을 병렬로 실행 후 데이터 병합
         const [museumData, historicData, religionData, etcData] = await Promise.all([
            museumPromise,
            historicPromise,
            religionPromise,
            etcPromise,
         ]);

         const mergedResults = [...museumData, ...historicData, ...religionData, ...etcData];

         console.log("📩 [API 응답 데이터]:", mergedResults);
         if (!mergedResults.length) {
            console.warn("⚠️ API 응답에 데이터가 없습니다.");
         }

         return mergedResults;
      } catch (err: unknown) {
         if (axios.isAxiosError(err)) {
            throw new Error(`Axios 요청이 실패했습니다: ${err.message}`);
         } else if (err instanceof Error) {
            throw new Error(`오류가 발생했습니다: ${err.message}`);
         } else {
            throw new Error(`알 수 없는 오류가 발생했습니다.`);
         }
      }
   }

   /**
    * TourAPI에서 미술관, 박물관 리스트를 가져오는 메서드
    *
    * @param {number} page - 불러올 페이지 번호. 기본값은 1
    * @returns {Promise<TourItem[]>}
    */
   static async getMuseumTourList(page: number = 1): Promise<TourItem[]> {
      try {
         const cat3List = ["A02060100", "A02060200", "A02060300", "A02060400", "A02060500"];
         console.log("📌 [API 요청] 미술관·박물관 리스트 요청");
         console.log("🔗 요청 URL:", this._tourDefaultURL + "areaBasedList1");
         // 여러 개의 cat3 값을 개별적으로 API 요청 후, 데이터를 병합
         const requests = cat3List.map(async (cat3) => {
            console.log(`📩 개별 요청: cat3=${cat3}`);
            const response = await axios.get(this._tourDefaultURL + "areaBasedList1", {
               params: {
                  ...this._tourDefaultOption,
                  pageNo: page,
                  areaCode: 32,
                  listYN: "Y",
                  cat1: "A02",
                  cat2: "A0206",
                  cat3: cat3, // 개별 요청
               },
            });
            // 응답 데이터가 예상대로 구성되어 있는지 확인
            return response.data?.response?.body?.items?.item || [];
         });
         // 모든 요청 완료 후 데이터를 병합
         const results = await Promise.all(requests);
         const mergedResults = results.flat(); // 다중 배열을 하나의 배열로 변환
         console.log("📩 [API 응답 데이터]:", mergedResults);
         if (!mergedResults.length) {
            console.warn("⚠️ API 응답에 데이터가 없습니다.");
         }
         return mergedResults;
      } catch (err: unknown) {
         if (axios.isAxiosError(err)) {
            throw new Error(`Axios 요청이 실패했습니다: ${err.message}`);
         } else if (err instanceof Error) {
            throw new Error(`오류가 발생했습니다: ${err.message}`);
         } else {
            throw new Error(`알 수 없는 오류가 발생했습니다.`);
         }
      }
   }
   /**
    * TourAPI에서 유적지 리스트를 가져오는 메서드
    *
    * @param {number} page - 불러올 페이지 번호. 기본값은 1
    * @returns {Promise<TourItem[]>}
    */
   static async getHistoricTourList(page: number = 1): Promise<TourItem[]> {
      try {
         const cat3List = ["A02010100", "A02010200", "A02010300", "A02010400", "A02010500", "A02010600", "A02010700"];
         console.log("📌 [API 요청] 유적지 리스트 요청");
         console.log("🔗 요청 URL:", this._tourDefaultURL + "areaBasedList1");
         const requests = cat3List.map(async (cat3) => {
            console.log(`📩 개별 요청: cat3=${cat3}`);
            const response = await axios.get(this._tourDefaultURL + "areaBasedList1", {
               params: {
                  ...this._tourDefaultOption,
                  pageNo: page,
                  areaCode: 32,
                  listYN: "Y",
                  cat1: "A02",
                  cat2: "A0201",
                  cat3: cat3,
               },
            });
            return response.data?.response?.body?.items?.item || [];
         });
         // 모든 요청을 병렬로 실행 후 데이터 병합
         const results = await Promise.all(requests);
         const mergedResults = results.flat();
         console.log("📩 [API 응답 데이터]:", mergedResults);
         if (!mergedResults.length) {
            console.warn("⚠️ API 응답에 데이터가 없습니다.");
         }
         return mergedResults;
      } catch (err: unknown) {
         if (axios.isAxiosError(err)) {
            throw new Error(`Axios 요청이 실패했습니다: ${err.message}`);
         } else if (err instanceof Error) {
            throw new Error(`오류가 발생했습니다: ${err.message}`);
         } else {
            throw new Error(`알 수 없는 오류가 발생했습니다.`);
         }
      }
   }
   /**
    * TourAPI에서 종교 여행지 리스트를 가져오는 메서드
    *
    * @param {number} page - 불러올 페이지 번호. 기본값은 1
    * @returns {Promise<TourItem[]>}
    */
   static async getRegionSitesData(page: number = 1): Promise<TourItem[]> {
      try {
         const cat3List = ["A02010800", "A02010900"];
         console.log("📌 [API 요청] 종교 여행지 리스트 요청");
         console.log("🔗 요청 URL:", this._tourDefaultURL + "areaBasedList1");
         const requests = cat3List.map(async (cat3) => {
            console.log(`📩 개별 요청: cat3=${cat3}`);
            const response = await axios.get(this._tourDefaultURL + "areaBasedList1", {
               params: {
                  ...this._tourDefaultOption,
                  pageNo: page,
                  areaCode: 32,
                  listYN: "Y",
                  cat1: "A02",
                  cat2: "A0201",
                  cat3: cat3,
               },
            });
            return response.data?.response?.body?.items?.item || [];
         });
         // 모든 요청을 병렬로 실행 후 데이터 병합
         const results = await Promise.all(requests);
         const mergedResults = results.flat();
         console.log("📩 [API 응답 데이터]:", mergedResults);
         if (!mergedResults.length) {
            console.warn("⚠️ API 응답에 데이터가 없습니다.");
         }
         return mergedResults;
      } catch (err: unknown) {
         if (axios.isAxiosError(err)) {
            throw new Error(`Axios 요청이 실패했습니다: ${err.message}`);
         } else if (err instanceof Error) {
            throw new Error(`오류가 발생했습니다: ${err.message}`);
         } else {
            throw new Error(`알 수 없는 오류가 발생했습니다.`);
         }
      }
   }
   /**
    * TourAPI에서 기타 여행지 리스트를 가져오는 메서드
    *
    * @param {number} page - 불러올 페이지 번호. 기본값은 1
    * @returns {Promise<TourItem[]>}
    */
   static async getEtcSitesData(page: number = 1): Promise<TourItem[]> {
      try {
         const cat3List = ["A02011000"];
         console.log("📌 [API 요청] 기타 여행지 리스트 요청");
         console.log("🔗 요청 URL:", this._tourDefaultURL + "areaBasedList1");
         const requests = cat3List.map(async (cat3) => {
            console.log(`📩 개별 요청: cat3=${cat3}`);
            const response = await axios.get(this._tourDefaultURL + "areaBasedList1", {
               params: {
                  ...this._tourDefaultOption,
                  pageNo: page,
                  areaCode: 32,
                  listYN: "Y",
                  cat1: "A02",
                  cat2: "A0201",
                  cat3: cat3,
               },
            });
            return response.data?.response?.body?.items?.item || [];
         });
         const results = await Promise.all(requests);
         const mergedResults = results.flat();
         console.log("📩 [API 응답 데이터]:", mergedResults);
         if (!mergedResults.length) {
            console.warn("⚠️ API 응답에 데이터가 없습니다.");
         }
         return mergedResults;
      } catch (err: unknown) {
         if (axios.isAxiosError(err)) {
            throw new Error(`Axios 요청이 실패했습니다: ${err.message}`);
         } else if (err instanceof Error) {
            throw new Error(`오류가 발생했습니다: ${err.message}`);
         } else {
            throw new Error(`알 수 없는 오류가 발생했습니다.`);
         }
      }
   }
}



