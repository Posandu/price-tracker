import { config } from "dotenv";

config();

const URL =
	"https://www.simplytek.lk/products/anker-space-one-pro-foldable-over-ear-headphones.js";
const FILE_PATH = "prices.txt";
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;
const IMPORTANT_PING = "<@961161387101536296>";

type Product = {
	price: number;
	available: boolean;
};

if (!DISCORD_WEBHOOK) {
	throw new Error("DISCORD_WEBHOOK is not set");
}

const fileExists = await Bun.file(FILE_PATH).exists();

if (!fileExists) {
	await Bun.file(FILE_PATH).write("");
}

const fileContent = (fileExists ? await Bun.file(FILE_PATH).text() : "")
	.split("\n")
	.filter(Boolean);

const lastPrice = +(fileContent.at(-1)?.trim() ?? "0");

const fetchProduct = async () => {
	const response = await fetch(URL);
	const data = await response.json();

	return data;
};

console.log("Fetching product...");
const product = await fetchProduct();
console.log("Product fetched");

const { price, available } = product as Product;

if (!price || !available) {
	console.log("Product not found - exiting gracefully");
	process.exit(0);
}

const realPrice = price / 100;

console.log(`Price: ${realPrice} - Available: ${available}`);

if (realPrice == lastPrice) {
	console.log("Price is the same - exiting gracefully");
	process.exit(0);
}

const priceChange = realPrice - lastPrice;
const priceChangePercent = lastPrice
	? ((priceChange / lastPrice) * 100).toFixed(2)
	: "N/A";
const trendColor =
	priceChange > 0 ? 0xff3b3b : priceChange < 0 ? 0x51d88a : 0x7289da;
const trendEmoji = priceChange > 0 ? "🔺" : priceChange < 0 ? "🔻" : "⏸️";

const dropImage = "https://i.pinimg.com/736x/e3/04/fb/e304fb3fc20245bb7964b9026c0b7997.jpg";
const increaseImage = "https://thumbs.dreamstime.com/b/homeless-emoticon-homeless-beggar-emoticon-begging-money-141585055.jpg";
const neutralImage = "https://img.freepik.com/premium-vector/happy-emoji-emoticon-holding-dollar-bills-cash-money_1303870-189.jpg";

const selectedImage =
	realPrice < lastPrice
		? dropImage
		: realPrice > lastPrice
		? increaseImage
		: neutralImage;

const embed = {
	content: realPrice < lastPrice ? `**Price Drop!** ${IMPORTANT_PING}` : "",
	embeds: [
		{
			title: `${trendEmoji} Price Update`,
			color: trendColor,
			fields: [
				{
					name: "New Price",
					value: `\`LKR ${realPrice}\``,
					inline: true,
				},
				{
					name: "Previous Price",
					value: `\`LKR ${lastPrice}\``,
					inline: true,
				},
				{
					name: "Change",
					value: `\`${
						priceChange > 0 ? "+" : ""
					}${priceChange} (${priceChangePercent}%)\``,
					inline: true,
				},
			],
			timestamp: new Date().toISOString(),
			footer: {
				text:
					priceChange < 0
						? "Deal Alert! The price has dropped!"
						: priceChange > 0
						? "Heads up! The price increased."
						: "No change in price.",
			},
			thumbnail: {
				url: selectedImage,
			},
		},
	],
	username: "💸 Prices Bot",
	avatar_url: selectedImage,
	attachments: [],
};

await fetch(DISCORD_WEBHOOK, {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
	},
	body: JSON.stringify(embed),
});

fileContent.push(`${realPrice}`);
await Bun.file(FILE_PATH).write(fileContent.join("\n"));
