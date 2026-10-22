import { Injectable } from '@nestjs/common'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

import { TextSplitter } from '../../domain/application/content/text-splitter.js'

@Injectable()
export class LangchainTextSplitter implements TextSplitter {
  private readonly splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  })

  split(text: string): Promise<string[]> {
    return this.splitter.splitText(text)
  }
}
