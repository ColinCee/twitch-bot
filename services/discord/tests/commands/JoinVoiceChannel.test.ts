import { JoinVoiceChannel } from "./../../src/commands/JoinVoiceChannel";
import { Message, VoiceChannel, GuildMember } from "discord.js";
import { createLogger } from "../../src/Logger";
import { Bot } from "../../src/enum/Bot";
import * as VoiceChannelManager from "../../src/VoiceChannelManager";

jest.mock("discord.js");
jest.mock("../../src/Logger", () => ({
  createLogger: jest.fn().mockReturnValue({
    error: jest.fn()
  })
}));
jest.mock("../../src/VoiceChannelManager");

const voiceChannelManagerMock = VoiceChannelManager as jest.Mocked<
  typeof VoiceChannelManager
>;
let message = new (Message as jest.Mock<Message>)();
const logger = createLogger();

afterEach(() => {
  jest.resetAllMocks();
  message = new (Message as jest.Mock<Message>)();
});

it("logs error when member is not of type GuildMember", async () => {
  const joinVoiceChannel = new JoinVoiceChannel(message, logger);

  await joinVoiceChannel.execute();
  expect(logger.error).toBeCalledTimes(1);
  expect(logger.error).toBeCalledWith(
    "Expected member of message to be of type GuildMember"
  );
});

it("replies with message when voice channel is not of type VoiceChannel", async () => {
  const guildMember = new (GuildMember as jest.Mock<GuildMember>)();
  Object.defineProperty(guildMember, "voice", { value: { channel: null } });
  Object.defineProperty(message, "member", { value: guildMember });

  const mockedReply = jest.fn();
  message.reply = mockedReply;

  const joinVoiceChannel = new JoinVoiceChannel(message, logger);
  await joinVoiceChannel.execute();

  expect(mockedReply).toBeCalledTimes(1);
  expect(mockedReply).toBeCalledWith(
    "You must be in a voice channel for me to join"
  );
});

it("is successful when member and voice channel are correct types", async () => {
  const voiceChannel = new (VoiceChannel as jest.Mock<VoiceChannel>)();
  // Can't define normally as voiceChannel.members is a discord class that needs mocked
  // However this class extends Map so we can use that here instead
  Object.defineProperty(voiceChannel, "members", { value: new Map() });

  const guildMember = new (GuildMember as jest.Mock<GuildMember>)();

  // Can't define normally as guildMember.voiceChannel is a readonly property
  Object.defineProperty(guildMember, "voice", {
    value: { channel: voiceChannel }
  });
  Object.defineProperty(message, "member", { value: guildMember });

  const joinVoiceChannel = new JoinVoiceChannel(message, logger);
  await joinVoiceChannel.execute();
  expect(logger.error).toBeCalledTimes(0);
});

it("does not join channel again when the bot is already in the channel", async () => {
  const voiceChannel = new (VoiceChannel as jest.Mock<VoiceChannel>)();
  // Can't define normally as voiceChannel.members is a discord class that needs mocked
  // However this class extends Map so we can use that here instead
  Object.defineProperty(voiceChannel, "members", {
    value: new Map([[Bot.USER_ID, true]])
  });

  const guildMember = new (GuildMember as jest.Mock<GuildMember>)();

  // Can't define normally as guildMember.voiceChannel is a readonly property
  Object.defineProperty(guildMember, "voice", {
    value: { channel: voiceChannel }
  });
  Object.defineProperty(message, "member", { value: guildMember });

  const joinVoiceChannel = new JoinVoiceChannel(message, logger);
  await joinVoiceChannel.execute();
  expect(logger.error).toBeCalledTimes(0);
  expect(message.reply).toHaveBeenCalledWith("Already in channel");
  expect(
    voiceChannelManagerMock.VoiceChannelManager.mock.instances[0]
  ).toBeUndefined();
});
