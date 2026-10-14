import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { T } from '@/components/ui/Typography';
import {
  Dribbble,
  Facebook,
  Github,
  Instagram,
  Twitter,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-muted/50 py-8 sm:py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 pb-12 md:pb-16">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src={'/logos/acme-logo-dark.png'}
                className="dark:hidden"
                width={32}
                height={32}
                alt="TeamFlow Logo"
              />
              <Image
                src={'/logos/acme-logo-light.png'}
                className="hidden dark:block"
                width={32}
                height={32}
                alt="TeamFlow Logo"
              />
              <T.H3 className="text-xl">TeamFlow</T.H3>
            </Link>

            <T.P className="text-sm text-muted-foreground">
              TeamFlow — realtime Kanban for teams.
            </T.P>

            <Separator />

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link
                  href="https://github.com/muhammadalithind12-create/teamflow"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <T.H4 className="text-sm font-semibold uppercase">Resources</T.H4>
            <nav className="flex flex-col space-y-2.5">
              <Link
                href="/board"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Live demo
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <T.H4 className="text-sm font-semibold uppercase">Follow us</T.H4>
            <nav className="flex flex-col space-y-2.5">
              <Link
                href="https://github.com/imbhargav5"
                target="_blank"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Github
              </Link>
              <Link
                href="https://twitter.com/codewithbhargav"
                target="_blank"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Twitter
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <T.H4 className="text-sm font-semibold uppercase">Legal</T.H4>
            <nav className="flex flex-col space-y-2.5">
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms &amp; Conditions
              </Link>
            </nav>
          </div>
        </div>

        <Separator className="my-6 lg:my-8" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <T.Small className="text-muted-foreground">
            © 2023{' '}
            <span className="text-foreground">TeamFlow</span>
            . All Rights Reserved.
          </T.Small>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/login" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/login" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/login" aria-label="Twitter">
                <Twitter className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/login" aria-label="GitHub">
                <Github className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/login" aria-label="Dribbble">
                <Dribbble className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
