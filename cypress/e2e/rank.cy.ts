import {
    areFoldersBalanced,
    generateRank,
    rebalanceFolders,
    sortByRankAndFolder,
    sortByRankAndFolderType,
  } from '@/utils/app/rank';
  
  import { Conversation } from '@/types/chat';
  import { FolderInterface } from '@/types/folder';
  import { OpenAIModels } from '@/types/openai';
  import { Prompt } from '@/types/prompt';
  
  const createFolder = (
    id: string,
    type: 'chat' | 'prompt',
    rank: number,
    deleted: boolean,
  ): FolderInterface => {
    return {
      id,
      type,
      rank,
      deleted,
      // Not required
      name: `Folder ${id}`,
      lastUpdateAtUTC: 0,
    };
  };
  
  const createConversation = (
    id: string,
    folderId: string | null,
    rank: number,
    deleted: boolean,
  ): Conversation => {
    return {
      id,
      folderId,
      rank,
      deleted,
      // Not required
      name: `Conversation ${id}`,
      messages: [],
      model: OpenAIModels['gpt-3.5-turbo-0613'],
      prompt: '',
      temperature: 0,
      lastUpdateAtUTC: 0,
    };
  };
  
  const createPrompt = (
    id: string,
    folderId: string | null,
    rank: number,
    deleted: boolean,
  ): Prompt => {
    return {
      id,
      folderId,
      rank,
      deleted,
      // Not required
      name: `Conversation ${id}`,
      description: '',
      content: '',
      model: OpenAIModels['gpt-3.5-turbo-0613'],
      lastUpdateAtUTC: 0,
    };
  };
  
  describe('Rank Functions', () => {
    describe('generateRank', () => {
      const folders = [
        createFolder('1', 'chat', 100, false),
        createFolder('2', 'chat', 200, false),
        createFolder('3', 'chat', 300, false),
      ];
  
      describe('insert at the start', () => {
        it('should generate proper rank', () => {
          const rank = generateRank(folders, 0);
          expect(rank).to.equal(50);
        });
      });
  
      describe('insert in the middle', () => {
        it('should generate proper rank', () => {
          const rank = generateRank(folders, 1);
          expect(rank).to.equal(150);
        });
      });
  
      describe('insert at the end', () => {
        it('should generate proper rank', () => {
          const rank = generateRank(folders, folders.length);
          expect(rank).to.equal(400);
        });
      });
  
      describe('insertion is < 0', () => {
        it('should default to end', () => {
          const rank = generateRank(folders, -1);
          expect(rank).to.equal(400);
        });
      });
  
      describe('insertion is > collection size', () => {
        it('should default to end', () => {
          const rank = generateRank(folders, folders.length + 1);
          expect(rank).to.equal(400);
        });
      });
    });
  
    describe('Conversations', () => {
      describe('sortByRankAndFolder', () => {
        const conversations = [
          createConversation('2', '1', 500, false),
          createConversation('4', '2', 200, true),
          createConversation('5', null, 200, false),
          createConversation('7', '2', 100, false),
          createConversation('3', null, 400, false),
          createConversation('1', null, 300, true),
          createConversation('6', '2', 400, false),
        ];
  
        it('should sort by rank and folder', () => {
          const sortedConversations = sortByRankAndFolder(conversations);
          const conversationIds = sortedConversations.map(
            (conversation) => conversation.id,
          );
          expect(conversationIds).to.deep.equal([
            '5',
            '3',
            '2',
            '7',
            '6',
            '1',
            '4',
          ]);
        });
      });
    });
  
    describe('Prompts', () => {
      describe('sortByRankAndFolder', () => {
        const prompts = [
          createPrompt('2', '1', 500, false),
          createPrompt('4', '2', 200, true),
          createPrompt('5', null, 200, false),
          createPrompt('7', '2', 100, false),
          createPrompt('3', null, 400, false),
          createPrompt('1', null, 300, true),
          createPrompt('6', '2', 400, false),
        ];
  
        it('should sort by rank and folder', () => {
          const sortedPrompts = sortByRankAndFolder(prompts);
          const promptIds = sortedPrompts.map((prompt) => prompt.id);
          expect(promptIds).to.deep.equal(['5', '3', '2', '7', '6', '1', '4']);
        });
      });
    });
  
    describe('Folders', () => {
      describe('sortByRankAndFolderType', () => {
        const folders = [
          createFolder('1', 'chat', 200, false),
          createFolder('3', 'prompt', 500, false),
          createFolder('5', 'chat', 100, true),
          createFolder('2', 'chat', 400, false),
          createFolder('6', 'prompt', 250, true),
          createFolder('4', 'prompt', 300, false),
        ];
  
        it('should sort by rank and folder type', () => {
          const sortedFolders = sortByRankAndFolderType(folders);
          const folderIds = sortedFolders.map((folder) => folder.id);
          expect(folderIds).to.deep.equal(['1', '2', '4', '3', '5', '6']);
        });
      });
  
      describe('areFoldersBalanced', () => {
        describe('ranks are perfect', () => {
          const folders = [
            createFolder('1', 'chat', 200, false),
            createFolder('2', 'chat', 250, false),
            createFolder('3', 'prompt', 100, false),
            createFolder('4', 'prompt', 500, false),
          ];
  
          it('should be balanced', () => {
            const balanced = areFoldersBalanced(folders);
            expect(balanced).to.be.true;
          });
        });
  
        describe('conflicting ranks, different folder types', () => {
          const folders = [
            createFolder('1', 'chat', 100, false),
            createFolder('2', 'prompt', 100, false),
          ];
  
          it('should be balanced', () => {
            const balanced = areFoldersBalanced(folders);
            expect(balanced).to.be.true;
          });
        });
  
        describe('conflicting ranks, same folder types', () => {
          const folders = [
            createFolder('1', 'chat', 100, false),
            createFolder('2', 'chat', 100, false),
          ];
  
          it('should not be balanced', () => {
            const balanced = areFoldersBalanced(folders);
            expect(balanced).to.be.false;
          });
        });
        describe('conflicting ranks, same folder types, one deleted', () => {
          const folders = [
            createFolder('1', 'chat', 100, false),
            createFolder('2', 'chat', 100, true),
          ];
  
          it('should be balanced', () => {
            const balanced = areFoldersBalanced(folders);
            expect(balanced).to.be.true;
          });
        });
  
        describe('conflicting ranks, same folder types, both deleted', () => {
          const folders = [
            createFolder('1', 'chat', 100, true),
            createFolder('2', 'chat', 100, true),
          ];
  
          it('should be balanced', () => {
            const balanced = areFoldersBalanced(folders);
            expect(balanced).to.be.true;
          });
        });
  
        describe('rank <= 0', () => {
          const folders = [createFolder('1', 'chat', 0, false)];
  
          it('should not be balanced', () => {
            const balanced = areFoldersBalanced(folders);
            expect(balanced).to.be.false;
          });
        });
      });
  
      describe('rebalanceFolders', () => {
        describe('conflicting ranks, same folder type', () => {
          const folders = [
            createFolder('1', 'chat', 200, false),
            createFolder('2', 'chat', 200, false),
          ];
  
          it('should rebalance ranks', () => {
            const rebalanced = rebalanceFolders(folders).map((folder) => [
              folder.id,
              folder.rank,
            ]);
            expect(rebalanced).to.deep.equal([
              ['1', 100],
              ['2', 200],
            ]);
          });
  
          it('should modify last updated at timestamp', () => {
            const timestamps = rebalanceFolders(folders).map(
              (folder) => folder.lastUpdateAtUTC,
            );
            for (const timestamp of timestamps) {
              expect(timestamp).to.be.greaterThan(0);
            }
          });
        });
  
        describe('conflicting ranks, different folder types', () => {
          const folders = [
            createFolder('1', 'chat', 200, false),
            createFolder('2', 'prompt', 200, false),
          ];
  
          it('should rebalance ranks', () => {
            const rebalanced = rebalanceFolders(folders).map((folder) => [
              folder.id,
              folder.rank,
            ]);
            expect(rebalanced).to.deep.equal([
              ['1', 100],
              ['2', 100],
            ]);
          });
        });
  
        describe('conflicting ranks, same folder types, one deleted', () => {
          const folders = [
            createFolder('1', 'chat', 200, false),
            createFolder('2', 'chat', 200, true),
          ];
  
          it('should rebalance ranks and ignore deleted', () => {
            const rebalanced = rebalanceFolders(folders).map((folder) => [
              folder.id,
              folder.rank,
            ]);
            expect(rebalanced).to.deep.equal([
              ['1', 100],
              ['2', 200],
            ]);
          });
        });
  
        describe('conflicting ranks, same folder types, both deleted', () => {
          const folders = [
            createFolder('1', 'chat', 200, true),
            createFolder('2', 'chat', 200, true),
          ];
  
          it('should rebalance ranks and ignore deleted', () => {
            const rebalanced = rebalanceFolders(folders).map((folder) => [
              folder.id,
              folder.rank,
            ]);
            expect(rebalanced).to.deep.equal([
              ['1', 200],
              ['2', 200],
            ]);
          });
        });
      });
    });
  });
  