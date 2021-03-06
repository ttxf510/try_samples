
package fits.sample;

import org.springframework.context.support.AbstractApplicationContext;
import org.springframework.context.support.ClassPathXmlApplicationContext;
import org.springframework.integration.channel.BeanFactoryChannelResolver;
import org.springframework.integration.channel.ChannelResolver;
import org.springframework.integration.channel.PollableChannel;
import org.springframework.integration.core.MessageChannel;
import org.springframework.integration.message.StringMessage;

public class TestMain {

    public static void main(String[] args) throws Exception {

		AbstractApplicationContext ctx = new ClassPathXmlApplicationContext("sample.xml", TestMain.class);

		ChannelResolver channelResolver = new BeanFactoryChannelResolver(ctx);

		MessageChannel inputChannel = channelResolver.resolveChannelName("input");

		inputChannel.send(new StringMessage("World"));

		ctx.stop();
    }

}