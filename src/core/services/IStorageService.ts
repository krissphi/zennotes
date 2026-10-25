import type { TreeDocumentData } from '../models/TreeDocument'

export interface IStorageService {
  saveDocument(doc: TreeDocumentData): Promise<void>
  loadDocument(): Promise<TreeDocumentData | null>
  clearDocument(): Promise<void>
}
