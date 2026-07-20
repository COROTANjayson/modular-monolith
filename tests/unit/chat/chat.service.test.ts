import { ChatService } from "../../../src/modules/chat/application/chat.service";
import { IChatMessageRepository } from "../../../src/modules/chat/domain/chat-message.repository";
import { IOrganizationAuthorization } from "../../../src/modules/organization/public/organization-authorization";

describe("ChatService authorization", () => {
  const messageRepository = {
    create: jest.fn(),
    findByTeamId: jest.fn(),
  } as unknown as jest.Mocked<IChatMessageRepository>;
  const organizationAuthorization = {
    getAccess: jest.fn(),
    hasPermission: jest.fn(),
    hasTeamAccess: jest.fn(),
  } as jest.Mocked<IOrganizationAuthorization>;
  const service = new ChatService(
    messageRepository,
    organizationAuthorization,
  );

  beforeEach(() => jest.clearAllMocks());

  it("rejects history access when organization/team access is denied", async () => {
    organizationAuthorization.hasTeamAccess.mockResolvedValue(false);

    await expect(
      service.getMessages("wrong-org", "team-1", "user-1"),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(messageRepository.findByTeamId).not.toHaveBeenCalled();
  });

  it("loads history for an authorized team member or leader", async () => {
    organizationAuthorization.hasTeamAccess.mockResolvedValue(true);
    messageRepository.findByTeamId.mockResolvedValue([]);

    await expect(
      service.getMessages("org-1", "team-1", "user-1", undefined, 25),
    ).resolves.toEqual([]);
    expect(organizationAuthorization.hasTeamAccess).toHaveBeenCalledWith(
      "org-1",
      "team-1",
      "user-1",
      "chat",
    );
    expect(messageRepository.findByTeamId).toHaveBeenCalledWith("team-1", {
      cursor: undefined,
      limit: 25,
    });
  });

  it("does not persist a message for a non-member", async () => {
    organizationAuthorization.hasTeamAccess.mockResolvedValue(false);

    await expect(
      service.sendMessage("org-1", "team-1", "user-1", "hello"),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(messageRepository.create).not.toHaveBeenCalled();
  });
});
