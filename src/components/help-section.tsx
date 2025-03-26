"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, HelpCircle, Shield, Flame, Skull, Info, Trophy } from "lucide-react"

export function HelpSection() {
  return (
    <Card className="border-orange-900/50 bg-gray-900/90 backdrop-blur-sm shadow-xl transform hover:shadow-orange-900/20 hover:shadow-2xl transition-all duration-300">
      <CardHeader className="border-b border-orange-900/50 bg-gradient-to-r from-gray-900 to-red-950">
        <CardTitle className="flex items-center gap-2 text-orange-400 font-cinzel">
          <HelpCircle className="h-6 w-6 text-orange-500" />
          How to Use the Inferno Token Burner
        </CardTitle>
        <CardDescription className="text-orange-200">
          Everything you need to know about burning those pesky spam tokens
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-orange-900/30">
            <AccordionTrigger className="text-orange-200 hover:text-orange-100 font-medium">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-2 text-orange-400" />
                What is Inferno Token Burner?
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-orange-200">
              <p className="mb-2">
                Inferno Token Burner is a fun and engaging tool that helps you clean your wallet by burning unwanted
                ERC-20 tokens that you&apos;ve received as spam or from phishing attempts.
              </p>
              <p className="mb-2">
                When you &quot;burn&quot; a token, you&apos;re sending it to a special burn address
                (0x000000000000000000000000000000000000dEaD) where it can never be recovered - effectively removing it
                from circulation forever.
              </p>
              <p>
                Many spam tokens lack verified code on blockchain explorers, preventing direct interaction via transfer
                functions on the explorer itself. However, these tokens still conform to standard ERC-20 ABIs, allowing
                them to be identified in wallets and explorers, and can be burned using this tool.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="border-orange-900/30">
            <AccordionTrigger className="text-orange-200 hover:text-orange-100 font-medium">
              <div className="flex items-center">
                <Flame className="h-5 w-5 mr-2 text-orange-400" />
                How to Burn Tokens
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-orange-200">
              <ol className="list-decimal pl-5 space-y-2">
                <li>Connect your wallet using the &quot;Connect Wallet&quot; button</li>
                <li>Select the correct network where your spam tokens exist</li>
                <li>Paste the token contract address in the input field</li>
                <li>Click &quot;Load&quot; to fetch the token information</li>
                <li>Review the token details to make sure it&apos;s the one you want to burn</li>
                <li>Click the &quot;BURN IT TO HELL!&quot; button to send the tokens to the burn address</li>
                <li>Confirm the transaction in your wallet</li>
                <li>Watch the satisfying burn animation as your tokens are incinerated!</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="border-orange-900/30">
            <AccordionTrigger className="text-orange-200 hover:text-orange-100 font-medium">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                Identifying Tokens to Burn
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-orange-200">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-orange-100 mb-1">Check for Liquidity First</h4>
                  <p className="mb-2">Before burning any token, check if it has liquidity and can be sold:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>
                      Search for the token on{" "}
                      <a
                        href="https://dexscreener.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        Dexscreener
                      </a>{" "}
                      or{" "}
                      <a
                        href="https://app.uniswap.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        Uniswap
                      </a>
                    </li>
                    <li>If the token has liquidity, consider selling it instead of burning</li>
                    <li>If there&apos;s no liquidity or it&apos;s a known scam, proceed with burning</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium text-orange-100 mb-1">Use Blockchain Explorers</h4>
                  <p className="mb-2">Blockchain explorers can help identify spam tokens:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>
                      Visit{" "}
                      <a
                        href="https://etherscan.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        Etherscan
                      </a>{" "}
                      or{" "}
                      <a
                        href="https://polygonscan.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        Polygonscan
                      </a>{" "}
                      and connect your wallet
                    </li>
                    <li>Look for tokens tagged as &quot;spam&quot; or &quot;phishing&quot;</li>
                    <li>Review your token list to identify suspicious tokens</li>
                    <li>Copy the contract address of tokens you want to burn</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium text-orange-100 mb-1">Common Signs of Spam Tokens</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>You don&apos;t remember buying or acquiring the token</li>
                    <li>The token has a name similar to a popular project but slightly different</li>
                    <li>You received it as an unexpected airdrop</li>
                    <li>The token&apos;s website asks you to connect your wallet and approve suspicious transactions</li>
                    <li>The token has no real utility or purpose</li>
                    <li>The token&apos;s contract hasn&apos;t been verified on block explorers</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4" className="border-orange-900/30">
            <AccordionTrigger className="text-orange-200 hover:text-orange-100 font-medium">
              <div className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                Combos and Sharing
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-orange-200">
              <p className="mb-2">
                Every time you burn a token, your combo count increases! The more tokens you burn in a session, the
                higher your rank becomes:
              </p>
              <ul className="list-disc pl-5 space-y-1 mb-2">
                <li>
                  <span className="text-orange-400 font-medium">Novice Burner</span>: 1-2 tokens
                </li>
                <li>
                  <span className="text-orange-300 font-medium">Flame Apprentice</span>: 3-4 tokens
                </li>
                <li>
                  <span className="text-yellow-300 font-medium">Inferno Adept</span>: 5-9 tokens
                </li>
                <li>
                  <span className="text-yellow-200 font-medium">Hellfire Master</span>: 10-14 tokens
                </li>
                <li>
                  <span className="text-red-300 font-medium">Demon Lord</span>: 15+ tokens
                </li>
              </ul>
              <p>
                Show off your burning skills by sharing your achievements on X (Twitter) or Warpcast! The more tokens
                you burn, the more impressive your share will be.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5" className="border-orange-900/30">
            <AccordionTrigger className="text-orange-200 hover:text-orange-100 font-medium">
              <div className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-green-500" />
                Safety Tips
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-orange-200">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Double-check the token</strong>: Make sure you&apos;re burning the right token. Once burned, tokens
                  cannot be recovered!
                </li>
                <li>
                  <strong>Never interact with suspicious tokens</strong>: If you receive an unknown token, it&apos;s best to
                  burn it rather than trying to sell it or visit its website.
                </li>
                <li>
                  <strong>Be cautious with approvals</strong>: Spam tokens often try to trick you into approving access
                  to your valuable tokens. Always review what you&apos;re approving.
                </li>
                <li>
                  <strong>Use a hardware wallet</strong>: For maximum security, consider using a hardware wallet for
                  your valuable assets.
                </li>
                <li>
                  <strong>Check gas fees</strong>: Make sure the gas fee for burning isn&apos;t excessive compared to the
                  value of the token.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-6 p-4 border border-red-800/50 rounded-md bg-red-950/30 flex items-center shadow-inner transform hover:shadow-red-900/20 hover:shadow-md transition-all duration-300">
          <Skull className="h-10 w-10 text-red-500 mr-4 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-red-400 mb-1 font-cinzel">Important Warning</h3>
            <p className="text-orange-200 text-sm">
              This tool is for burning unwanted spam tokens only. Never burn tokens that have actual value or that you
              might want to keep. Once tokens are sent to the burn address, they cannot be recovered under any
              circumstances!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

