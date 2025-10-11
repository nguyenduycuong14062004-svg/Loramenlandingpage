// product-detail.js
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get("id"));

  const products = await loadProductsSource();
  const product = products.find(p => p.id === id);

  if (!product) {
    document.getElementById("productDetail").innerHTML = "<p class='text-center text-gray-500'>Không tìm thấy sản phẩm.</p>";
    return;
  }

  // Gán dữ liệu
  document.getElementById("prodImgMain").src = product.img1 || "";
  document.getElementById("prodTitle").innerText = product.title || "";
  document.getElementById("prodPrice").innerText =
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(product.price));
  document.getElementById("prodDesc").innerText = product.desc || "";

  // Hiển thị gallery (nếu có ảnh 2)
  const gallery = document.getElementById("prodGallery");
  if (product.img2) {
    [product.img1, product.img2].forEach(img => {
      const thumb = document.createElement("img");
      thumb.src = "/assets/images/sp1.jpg";
      thumb.className = "w-20 h-20 object-cover rounded-lg border hover:scale-105 transition cursor-pointer";
      thumb.addEventListener("click", () => {
        document.getElementById("prodImgMain").src = img;
      });
      gallery.appendChild(thumb);
    });
  }

  // Nút mua
  document.getElementById("buyNowBtn").addEventListener("click", () => {
    showOrderModal({
      name: product.title,
      img: product.img1,
      price: product.price
    });
  });

  // Bình luận mẫu (giả lập)
  const comments = [
    { name: "Nam Nguyễn", text: "Sản phẩm cực kỳ chất lượng, mùi thơm nam tính lắm!", stars: 5 },
    { name: "Huy Lê", text: "Đóng gói đẹp, giao hàng nhanh, đáng tiền!", stars: 5 },
    { name: "Minh T.", text: "Mùi thơm giữ được lâu, đúng như mô tả!", stars: 5 },
    { name: "Tấn Phát", text: "Đã mua lần 2, quá ưng!", stars: 5 },
  ];

  const commentList = document.getElementById("commentList");
  comments.forEach(c => {
    const div = document.createElement("div");
    div.className = "bg-white p-4 rounded-lg shadow-sm";
    div.innerHTML = `
      <div class="flex items-center justify-between">
        <strong>${c.name}</strong>
        <div class="text-yellow-400">★★★★★</div>
      </div>
      <p class="text-gray-700 mt-2">${c.text}</p>
    `;
    commentList.appendChild(div);
  });
});
