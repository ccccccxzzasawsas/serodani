/**
 * ქეშირების კონფიგურაცია საიტის სხვადასხვა ნაწილებისთვის
 */

// სტატიკური გვერდების ქეშირების დროის პერიოდი (7 დღე)
export const STATIC_PAGE_REVALIDATE_TIME = 86400 * 7;

// დინამიური მონაცემების ქეშირების დროის პერიოდი (1 საათი)
export const DYNAMIC_DATA_REVALIDATE_TIME = 3600;

// ოთახების მონაცემების ქეშირების დროის პერიოდი (24 საათი)
export const ROOMS_REVALIDATE_TIME = 86400;

// ღვინის მონაცემების ქეშირების დროის პერიოდი (24 საათი)
export const WINES_REVALIDATE_TIME = 86400;

// გალერეის მონაცემების ქეშირების დროის პერიოდი (7 დღე)
export const GALLERY_REVALIDATE_TIME = 86400 * 7;

// ქეშირების ტაგები, რომლებიც გამოიყენება revalidate-ისთვის
export const CACHE_TAGS = {
  rooms: 'rooms',
  wines: 'wines',
  gallery: 'gallery',
  dining: 'dining',
  bookings: 'bookings',
}; 