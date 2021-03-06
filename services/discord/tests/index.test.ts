import { main } from "../src/index";
import discord from "../src/api/discord";
import { Redis } from "../src/api/redis";
import { createLogger } from "../src/Logger";

jest.mock("../src/Logger", () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn()
  })
}));

jest.mock("../src/api/discord");
jest.mock("../src/api/redis");

it("runs expected", async () => {
  await main();

  expect(discord.connect).toBeCalled();
  expect(Redis.connect).toBeCalled();
});

it("logs error when exception is thrown", async () => {
  expect(async () => {
    discord.connect = () => {
      throw new Error("Test");
    };
    await main();
    expect(createLogger().error).toBeCalled();
  }).rejects.toThrowError("Test");
});
