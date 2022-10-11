const express = require("express");
const app = express();
const cors = require("cors");
const Moralis = require("moralis").default;
const port = 8080;

require("dotenv").config();

app.use(cors());

app.get("/", (req, res) => {
	res.send("Hello, Moralis");
});

app.listen(port, () => {
	console.log(`Listning at port ${port}`);
});

app.get("/native-balance", async (req, res) => {
	try {
		await Moralis.start({ apiKey: process.env.MORALIS_API_KEY });

		const { address, chain } = req.query;
		const response = await Moralis.EvmApi.balance.getNativeBalance({
			address,
			chain,
		});
		console.log(
			`This is the response for getNativePrice ${JSON.stringify(
				response
			)}`
		);

		const nativeBalance = response.data;

		let nativeCurrency;
		let nativePrice;
		if (chain === "0x1") {
			nativeCurrency = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
			nativePrice = await Moralis.EvmApi.token.getTokenPrice({
				address: nativeCurrency,
				chain: chain,
			});
			nativeBalance.usd = nativePrice.data.usdPrice;
		} else if (chain === "0x89") {
			nativeCurrency = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";
			nativePrice = await Moralis.EvmApi.token.getTokenPrice({
				address: nativeCurrency,
				chain: chain,
			});
			nativeBalance.usd = nativePrice.data.usdPrice;
		} else {
			nativePrice = 0;
			nativeBalance.usd = 0;
		}

		res.send(nativeBalance);
	} catch (error) {
		res.send(error);
	}
});

app.get("/token-balances", async (req, res) => {
	try {
		await Moralis.start({ apiKey: process.env.MORALIS_API_KEY });

		const { address, chain } = req.query;

		const response = await Moralis.EvmApi.token.getWalletTokenBalances({
			address: address,
			chain: chain,
		});

		const tokens = response.data;
		// console.log(response.data);
		// console.log(tokens);

		let legitTokens = [];
		if (chain === "0x1" || "0x89") {
			for (let i = 0; i < tokens.length; i++) {
				// console.log(tokens.length);
				try {
					const tokenPrice = await Moralis.EvmApi.token.getTokenPrice(
						{
							address: tokens[i].token_address,
							chain: chain,
						}
					);
					if (Number(tokenPrice.data.usdPrice) > Number(0.01)) {
						tokens[i].usd = tokenPrice.data.usdPrice;
						legitTokens.push(tokens[i]);
					} else {
						console.log(
							`Rejected ${tokens[i]} as its price is less than 0.01 doller`
						);
						console.log(tokenPrice.data.usdPrice);
					}
				} catch (error) {
					console.log(error);
				}
			}
		} else {
			legitTokens = tokens;
		}
		// console.log(legitTokens);
		res.send(legitTokens);
	} catch (error) {
		res.send(error);
	}
});

app.get("/token-transfers", async (req, res) => {
	try {
		await Moralis.start({ apiKey: process.env.MORALIS_API_KEY });

		const { address, chain } = req.query;

		const response = await Moralis.EvmApi.token.getWalletTokenTransfers({
			address: address,
			chain: chain,
		});

		// console.log(response.data);

		const userTransfer = response.data.result;

		let userTransferDetails = [];

		for (let i = 0; i < userTransfer.length; i++) {
			const metadataResponse =
				await Moralis.EvmApi.token.getTokenMetadata({
					addresses: [userTransfer[i].address],
					chain: chain,
				});

			if (metadataResponse) {
				userTransfer[i].decimals = metadataResponse.data[0].decimals;
				userTransfer[i].symbol = metadataResponse.data[0].symbol;
				userTransfer[i].name = metadataResponse.data[0].name;
				userTransferDetails.push(userTransfer[i]);
			} else {
				console.log(`No details available for ${userTransfer[i]}`);
			}
		}

		res.send(userTransferDetails);
	} catch (error) {
		res.send(error);
	}
});

app.get("/nft-balance", async (req, res) => {
	try {
		await Moralis.start({ apiKey: process.env.MORALIS_API_KEY });

		const { address, chain } = req.query;
		const response = await Moralis.EvmApi.nft.getWalletNFTs({
			address: address,
			chain: chain,
		});

		res.send(response.data.result);
	} catch (error) {
		res.send(error);
	}
});
